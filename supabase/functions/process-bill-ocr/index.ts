import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ProcessBillOCRRequest {
  importedBillId: string;
  userId: string;
}

// Helper to convert bytes to base64 string
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Simple decryption (mirror of encryption in auth-gmail-token)
function decryptToken(encrypted: string): string {
  try {
    const decoded = atob(encrypted);
    const [token] = decoded.split("|");
    if (!token) {
      throw new Error("Decrypted token was empty or malformed");
    }
    return token;
  } catch (error) {
    console.error(
      `Error decrypting token - message=${(error as Error).message}`,
    );
    throw new Error("Failed to decrypt token");
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { importedBillId, userId } = (await req.json()) as ProcessBillOCRRequest;

    if (!importedBillId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing importedBillId or userId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // 1. Fetch imported bill details
    const { data: importedBill, error: billError } = await supabaseClient
      .from("imported_bills")
      .select("*")
      .eq("id", importedBillId)
      .eq("user_id", userId)
      .single();

    if (billError || !importedBill) {
      return new Response(
        JSON.stringify({ error: "Imported bill not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Fetch email import settings to get access token
    const { data: emailSettings, error: settingsError } = await supabaseClient
      .from("email_import_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (settingsError || !emailSettings) {
      return new Response(
        JSON.stringify({ error: "Email settings not found. Please connect Gmail." }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 3. Decrypt the access token
    let accessToken: string;
    try {
      accessToken = decryptToken(emailSettings.oauth_token);
    } catch (error) {
      console.error("Failed to decrypt access token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to decrypt access token. Please reconnect Gmail." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Get Google Vision API key
    const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!googleVisionApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Vision API key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const { file_url, file_type, subject } = importedBill;

    if (!file_url) {
      return new Response(
        JSON.stringify({ error: "No file URL found for this bill" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Download the document
    console.log(
      `Processing bill OCR for ${importedBillId} (type=${file_type}, url=${file_url})`
    );

    let bytes: Uint8Array | null = null;

    if (file_type === "attachment" && file_url.startsWith("gmail://")) {
      // gmail://messageId/partId
      const match = file_url.match(/^gmail:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Invalid gmail attachment URL format" }),
          { status: 400, headers: corsHeaders }
        );
      }
      const [, messageId, partId] = match;

      const attachmentRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${partId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!attachmentRes.ok) {
        const body = await attachmentRes.text().catch(() => "");
        console.error(
          `Failed to download Gmail attachment - status=${attachmentRes.status}, body=${body}`
        );
        return new Response(
          JSON.stringify({
            error: `Failed to download Gmail attachment: ${attachmentRes.status}. Please reconnect Gmail.`,
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      const data = await attachmentRes.json();
      // Gmail attachment data is base64url encoded
      const base64Data = (data.data as string)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const binaryString = atob(base64Data);
      const arr = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        arr[i] = binaryString.charCodeAt(i);
      }
      bytes = arr;
    } else {
      // Treat as direct link: fetch and read as bytes
      const fileRes = await fetch(file_url);
      if (!fileRes.ok) {
        console.error(
          `Failed to download bill from link - status=${fileRes.status}`
        );
        return new Response(
          JSON.stringify({
            error: `Failed to download bill from link: ${fileRes.status}`,
          }),
          { status: 400, headers: corsHeaders }
        );
      }
      const arrayBuffer = await fileRes.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    }

    if (!bytes || bytes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No document data downloaded" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 6. Convert to base64 for Vision API
    const base64Data = bytesToBase64(bytes);

    console.log(`Calling Google Vision API for bill ${importedBillId}`);

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [
                { type: "TEXT_DETECTION" },
                { type: "DOCUMENT_TEXT_DETECTION" },
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text().catch(() => "");
      console.error(`Google Vision API error: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Google Vision API error: ${errorText}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    const visionData = await visionResponse.json();
    const visionResponse0 = visionData.responses?.[0];

    if (!visionResponse0 || visionResponse0.error) {
      const errorMsg = JSON.stringify(visionResponse0?.error);
      console.error(`Vision API error response: ${errorMsg}`);
      return new Response(
        JSON.stringify({ error: `Vision API error: ${errorMsg}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    const extractedText = visionResponse0.fullTextAnnotation?.text || "";
    console.log(`Extracted ${extractedText.length} characters from bill`);

    // 7. Simple date extraction
    const dateRegex = new RegExp(
      "\\d{1,2}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{2,4}|\\d{4}[/\\-.\\s]\\d{1,2}[/\\-.\\s]\\d{1,2}",
      "g"
    );
    const dates = (extractedText.match(dateRegex) as string[]) || [];

    const billTerms = [
      "due date",
      "expiry",
      "warranty",
      "invoice",
      "amount",
      "total",
      "bill",
      "payment",
    ];
    const billTermsFound = billTerms.filter((term) =>
      extractedText.toLowerCase().includes(term)
    );

    const confidence =
      (billTermsFound.length / billTerms.length) * 100 +
      (dates.length > 0 ? 20 : 0);

    // 8. Store OCR result
    const { data: ocrResult, error: ocrInsertError } = await supabaseClient
      .from("ocr_results")
      .insert({
        extracted_text: extractedText,
        extracted_items: dates.length > 0 ? { dates } : {},
        bill_probability: Math.min(confidence, 100),
        created_at: new Date(),
      })
      .select()
      .single();

    if (ocrInsertError || !ocrResult) {
      console.error("Failed to store OCR result:", ocrInsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store OCR result" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 9. Update imported bill with OCR result
    const { error: updateError } = await supabaseClient
      .from("imported_bills")
      .update({
        ocr_result_id: ocrResult.id,
        ocr_status: "completed",
        updated_at: new Date(),
      })
      .eq("id", importedBillId);

    if (updateError) {
      console.error("Failed to update imported bill:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update imported bill" }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ocrResultId: ocrResult.id,
        extractedText: extractedText.substring(0, 500), // Return first 500 chars
        datesFound: dates,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unexpected error in process-bill-ocr:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
