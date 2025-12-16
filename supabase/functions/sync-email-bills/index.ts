import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface EmailImportSettings {
  user_id: string;
  email_address: string;
  enabled: boolean;
  oauth_token: string;
  oauth_refresh_token: string | null;
  token_expires_at: string;
  sync_error: string | null;
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
// encryptToken stored `${token}|${key}` as base64, we only need the token part
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

async function runOcrForImportedBill(
  supabaseClient: ReturnType<typeof createClient>,
  params: {
    userId: string;
    importedBillId: string;
    subject: string;
    fileUrl: string | null;
    fileType: string | null;
    accessToken: string;
    googleVisionApiKey: string;
  },
): Promise<void> {
  const { userId, importedBillId, subject, fileUrl, fileType, accessToken, googleVisionApiKey } =
    params;

  try {
    if (!fileUrl) {
      console.log(
        `Skipping OCR for imported bill ${importedBillId} (no file URL)`,
      );
      return;
    }

    console.log(
      `Running OCR for imported bill ${importedBillId} (type=${fileType}, url=${fileUrl})`,
    );

    // 1) Download the document as bytes
    let bytes: Uint8Array | null = null;

    if (fileType === "attachment" && fileUrl.startsWith("gmail://")) {
      // gmail://messageId/partId
      const match = fileUrl.match(/^gmail:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        console.error(
          `Invalid gmail attachment URL for bill ${importedBillId}: ${fileUrl}`,
        );
        return;
      }
      const [, messageId, partId] = match;

      const attachmentRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${partId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!attachmentRes.ok) {
        const body = await attachmentRes.text().catch(() => "");
        console.error(
          `Failed to download Gmail attachment for bill ${importedBillId} - status=${attachmentRes.status}, body=${body}`,
        );
        return;
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
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        console.error(
          `Failed to download bill from link for bill ${importedBillId} - status=${fileRes.status}`,
        );
        return;
      }
      const arrayBuffer = await fileRes.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    }

    if (!bytes || bytes.length === 0) {
      console.error(
        `No bytes downloaded for bill ${importedBillId}, skipping OCR`,
      );
      return;
    }

    // 2) Convert to base64 for Vision API
    const base64Data = bytesToBase64(bytes);

    console.log(
      `Calling Google Vision API for bill ${importedBillId} (subject="${subject}")`,
    );

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
      },
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text().catch(() => "");
      console.error(
        `Google Vision API error for bill ${importedBillId}: ${errorText}`,
      );
      return;
    }

    const visionData = await visionResponse.json();
    const visionResponse0 = visionData.responses?.[0];

    if (!visionResponse0 || visionResponse0.error) {
      console.error(
        `Vision API error response for bill ${importedBillId}: ${JSON.stringify(visionResponse0?.error)}`,
      );
      return;
    }

    const extractedText = visionResponse0.fullTextAnnotation?.text || "";
    console.log(
      `Extracted ${extractedText.length} characters from bill ${importedBillId}`,
    );

    // Very simple date extraction like in ocr-process-bill
    const dateRegex =
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
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

    // Insert OCR result
    const ocrResultId = crypto.randomUUID();

    const { error: ocrInsertError } = await supabaseClient
      .from("ocr_results")
      .insert({
        id: ocrResultId,
        user_id: userId,
        text: extractedText,
        extracted_data: {
          dates,
          bill_terms_found: billTermsFound,
          document_type: "bill",
        },
        confidence: 0.85,
        metadata: {
          source: "email_import_auto",
          billSubject: subject,
        },
      });

    if (ocrInsertError) {
      console.error(
        `Error saving OCR result for bill ${importedBillId}: ${JSON.stringify(ocrInsertError)}`,
      );
      return;
    }

    // Optionally pick a naive due date: latest parsed date
    let extractedDueDate: string | null = null;
    if (dates.length > 0) {
      const parsedDates = dates
        .map((d) => Date.parse(d))
        .filter((t) => !Number.isNaN(t));
      if (parsedDates.length > 0) {
        const latest = new Date(Math.max(...parsedDates));
        extractedDueDate = latest.toISOString().split("T")[0];
      }
    }

    // Update imported_bills with OCR result id and optional due date
    const { error: billUpdateError } = await supabaseClient
      .from("imported_bills")
      .update({
        ocr_result_id: ocrResultId,
        extracted_due_date: extractedDueDate,
      })
      .eq("id", importedBillId);

    if (billUpdateError) {
      console.error(
        `Error linking OCR result to bill ${importedBillId}: ${JSON.stringify(billUpdateError)}`,
      );
      return;
    }

    // Create a reminder if we have a due date
    if (extractedDueDate) {
      const reminderTitle = `Bill Reminder: ${subject || "Imported Bill"}`;
      const { error: reminderError } = await supabaseClient
        .from("reminders")
        .insert({
          user_id: userId,
          title: reminderTitle,
          description: extractedText.substring(0, 200),
          due_date: extractedDueDate,
          source_type: "email_import",
          source_id: importedBillId,
          status: "pending",
        });

      if (reminderError) {
        console.error(
          `Error creating reminder for bill ${importedBillId}: ${JSON.stringify(reminderError)}`,
        );
      } else {
        console.log(
          `Auto OCR + reminder created for bill ${importedBillId} (due date ${extractedDueDate})`,
        );
      }
    } else {
      console.log(
        `Auto OCR completed for bill ${importedBillId}, but no due date detected`,
      );
    }
  } catch (error) {
    console.error(
      `Error running OCR for imported bill ${params.importedBillId} - message=${(error as Error).message}`,
    );
  }
}

// Refresh OAuth token if expired
async function refreshTokenIfNeeded(
  emailImport: EmailImportSettings,
  googleClientId: string,
  googleClientSecret: string
): Promise<string> {
  const expiresAt = new Date(emailImport.token_expires_at);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minute buffer

  if (now.getTime() > expiresAt.getTime() - bufferTime) {
    console.log(
      `Token expired or expiring soon for user ${emailImport.user_id}, refreshing...`,
    );

    if (!emailImport.oauth_refresh_token) {
      throw new Error("No refresh token available");
    }

    const refreshToken = decryptToken(emailImport.oauth_refresh_token);
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenParams = new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `Failed to refresh token for user ${emailImport.user_id} - status=${response.status}, body=${body}`,
      );
      throw new Error(
        `Failed to refresh token: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.access_token;
  }

  return decryptToken(emailImport.oauth_token);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleClientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const googleVisionApiKey = Deno.env.get("VITE_GOOGLE_VISION_API_KEY");

    if (!supabaseUrl || !supabaseKey || !googleClientId || !googleClientSecret || !googleVisionApiKey) {
      console.error(
        `Missing environment variables - SUPABASE_URL=${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY=${!!supabaseKey}, VITE_GOOGLE_CLIENT_ID=${!!googleClientId}, GOOGLE_CLIENT_SECRET=${!!googleClientSecret}, VITE_GOOGLE_VISION_API_KEY=${!!googleVisionApiKey}`,
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get all enabled email imports
    const { data: emailImports, error: queryError } = await supabaseClient
      .from("email_imports")
      .select("*")
      .eq("enabled", true) as { data: EmailImportSettings[] | null; error: any };

    if (queryError) {
      console.error(
        `Error fetching email imports - error=${JSON.stringify(queryError)}`,
      );
      throw queryError;
    }

    if (!emailImports || emailImports.length === 0) {
      console.log("No active email imports to sync");
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No active imports" }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`Found ${emailImports.length} active email imports to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    // Sync emails for each user
    for (const emailImport of emailImports) {
      try {
        console.log(`Syncing emails for user: ${emailImport.user_id}`);

        // Get fresh access token
        const accessToken = await refreshTokenIfNeeded(
          emailImport,
          googleClientId,
          googleClientSecret
        );

        // Fetch unread emails from past 7 days with bill-related keywords
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const query = `is:unread after:${sevenDaysAgo} (
          subject:(invoice OR bill OR receipt OR warranty OR service OR renewal OR subscription OR expiry OR due OR payment) OR
          from:(invoice OR billing OR noreply OR support)
        )`;

        const gmailResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!gmailResponse.ok) {
          const body = await gmailResponse.text().catch(() => "");
          console.error(
            `Gmail list API error for user ${emailImport.user_id} - status=${gmailResponse.status}, body=${body}`,
          );
          throw new Error(
            `Gmail list API error: ${gmailResponse.status} ${gmailResponse.statusText}`,
          );
        }

        const gmailData = await gmailResponse.json();
        const messages = gmailData.messages || [];

        console.log(
          `Found ${messages.length} potential bill emails for user ${emailImport.user_id}`
        );

        // Process each message
        for (const message of messages) {
          try {
            // Check if already imported
            const { data: existing, error: existingError } = await supabaseClient
              .from("imported_bills")
              .select("id")
              .eq("user_id", emailImport.user_id)
              .eq("gmail_message_id", message.id)
              .single();

            if (existingError && existingError.code !== "PGRST116") {
              console.error(
                `Error checking existing imported bill for user ${emailImport.user_id}, message ${message.id} - error=${JSON.stringify(existingError)}`,
              );
              throw existingError;
            }

            if (existing) {
              console.log(`Message ${message.id} already imported, skipping`);
              continue;
            }

            // Get full message details
            const messageResponse = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (!messageResponse.ok) {
              const body = await messageResponse.text().catch(() => "");
              console.error(
                `Gmail message API error for user ${emailImport.user_id}, message ${message.id} - status=${messageResponse.status}, body=${body}`,
              );
              throw new Error(
                `Gmail message API error: ${messageResponse.status} ${messageResponse.statusText}`,
              );
            }

            const messageData = await messageResponse.json();
            const headers = messageData.payload?.headers || [];
            const subject =
              headers.find((h: any) => h.name === "Subject")?.value || "(No subject)";
            const from =
              headers.find((h: any) => h.name === "From")?.value || "(Unknown)";
            const receivedDate =
              headers.find((h: any) => h.name === "Date")?.value || new Date().toISOString();

            // Extract attachment or link from message
            let fileUrl = null;
            let fileType = null;

            // Look for attachments
            if (messageData.payload?.parts) {
              for (const part of messageData.payload.parts) {
                if (
                  part.filename &&
                  (part.filename.endsWith(".pdf") ||
                    part.filename.endsWith(".jpg") ||
                    part.filename.endsWith(".png"))
                ) {
                  // Save attachment for processing
                  fileUrl = `gmail://${message.id}/${part.partId}`;
                  fileType = "attachment";
                  break;
                }
              }
            }

            // If no attachment, look for links in email body
            if (!fileUrl && messageData.payload?.body?.data) {
              const bodyText = atob(messageData.payload.body.data);
              const linkRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/g;
              const links = bodyText.match(linkRegex);
              if (links && links.length > 0) {
                // Filter for likely bill documents
                const billLink = links.find(
                  (link) =>
                    link.includes("pdf") ||
                    link.includes("invoice") ||
                    link.includes("bill") ||
                    link.includes("receipt")
                );
                if (billLink) {
                  fileUrl = billLink;
                  fileType = "link";
                }
              }
            }

            // Additional heuristic filtering: only treat as bill-like emails
            const combinedText = `${subject} ${from}`.toLowerCase();
            const billKeywords = [
              "bill",
              "invoice",
              "statement",
              "payment due",
              "amount due",
              "subscription",
              "renewal",
              "warranty",
              "policy",
              "receipt",
            ];
            const looksLikeBill = billKeywords.some((kw) =>
              combinedText.includes(kw)
            );

            // Skip messages that don't have any attachment/link OR don't look like bills
            if (!fileUrl || !looksLikeBill) {
              console.log(
                `Skipping message ${message.id} (looksLikeBill=${looksLikeBill}, hasFile=${!!fileUrl})`,
              );
              continue;
            }

            // Save imported bill record
            const {
              data: insertedBill,
              error: insertError,
            } = await supabaseClient
              .from("imported_bills")
              .insert({
                user_id: emailImport.user_id,
                email_import_id: emailImport.id,
                gmail_message_id: message.id,
                subject,
                from_email: from,
                received_at: new Date(receivedDate),
                file_url: fileUrl,
                file_type: fileType,
              })
              .select("id")
              .single();

            if (insertError || !insertedBill) {
              console.error(
                `Error saving imported bill for user ${emailImport.user_id}, message ${message.id} - error=${JSON.stringify(insertError)}`,
              );
            } else {
              console.log(
                `Imported bill: ${subject} (id=${insertedBill.id}) - starting OCR`,
              );
              syncedCount++;
              // Auto-run OCR + reminder creation for this imported bill
              await runOcrForImportedBill(supabaseClient, {
                userId: emailImport.user_id,
                importedBillId: insertedBill.id,
                subject,
                fileUrl,
                fileType,
                accessToken,
                googleVisionApiKey,
              });
            }
          } catch (messageError) {
            console.error(`Error processing message ${message.id}:`, messageError);
            errorCount++;
          }
        }

        // Update last synced timestamp
        await supabaseClient
          .from("email_imports")
          .update({
            last_synced_at: new Date(),
            sync_error: null,
          })
          .eq("user_id", emailImport.user_id);
      } catch (userError) {
        console.error(
          `Error syncing for user ${emailImport.user_id} - message=${(userError as Error).message}`,
        );
        errorCount++;

        // Save error message
        await supabaseClient
          .from("email_imports")
          .update({
            sync_error: (userError as Error).message,
          })
          .eq("user_id", emailImport.user_id);
      }
    }

    console.log(
      `Sync complete: ${syncedCount} bills imported, ${errorCount} errors`
    );

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        message: `Successfully synced emails for ${emailImports.length} users`,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(
      `Unexpected error in sync-email-bills - message=${(error as Error).message}`,
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
