import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OCRProcessRequest {
  importedBillId: string;
  userId: string;
  storagePath: string;
  billSubject: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const {
      importedBillId,
      userId,
      storagePath,
      billSubject,
    } = (await req.json()) as OCRProcessRequest;

    if (!importedBillId || !userId || !storagePath) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleVisionApiKey = Deno.env.get("VITE_GOOGLE_VISION_API_KEY");

    if (!supabaseUrl || !supabaseKey || !googleVisionApiKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing bill: ${billSubject} for user: ${userId}`);

    // Download image from storage
    const storageBucket = "bill-documents";
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage.from(storageBucket)
      .download(storagePath);

    if (downloadError) {
      console.error("Error downloading from storage:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download bill document" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
    const base64Data = btoa(binaryString);

    console.log("Bill converted to base64, calling Google Vision API...");

    // Call Google Vision API for OCR
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
      const errorText = await visionResponse.text();
      console.error("Google Vision API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Google Vision API failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const visionData = await visionResponse.json();
    const visionResponse_0 = visionData.responses?.[0];

    if (!visionResponse_0 || visionResponse_0.error) {
      console.error("Vision API error response:", visionResponse_0?.error);
      return new Response(
        JSON.stringify({ error: "OCR processing failed" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract text
    const extractedText = visionResponse_0.fullTextAnnotation?.text || "";
    console.log(`Extracted ${extractedText.length} characters from bill`);

    // Parse key information from text
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
    const dates = extractedText.match(dateRegex) || [];

    // Look for key terms related to bills
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

    console.log("Found bill terms:", billTermsFound);
    console.log("Found dates:", dates);

    // Create OCR result record
    const ocrResultId = crypto.randomUUID();
    const { error: insertError } = await supabaseClient
      .from("ocr_results")
      .insert({
        id: ocrResultId,
        user_id: userId,
        text: extractedText,
        extracted_data: {
          dates: dates,
          bill_terms_found: billTermsFound,
          document_type: "bill",
        },
        confidence: 0.85, // Default confidence
        metadata: {
          fileName: storagePath,
          source: "email_import",
          billSubject: billSubject,
        },
      });

    if (insertError) {
      console.error("Error saving OCR result:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save OCR result" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Link OCR result to imported bill
    const { error: linkError } = await supabaseClient
      .from("imported_bills")
      .update({
        ocr_result_id: ocrResultId,
      })
      .eq("id", importedBillId);

    if (linkError) {
      console.error("Error linking OCR result to bill:", linkError);
    }

    console.log("Bill OCR processing complete, result ID:", ocrResultId);

    return new Response(
      JSON.stringify({
        success: true,
        ocrResultId,
        extractedText: extractedText.substring(0, 500),
        datesFound: dates,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
