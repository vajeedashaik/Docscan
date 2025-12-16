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

// Simple decryption (mirror of encryption in auth-gmail-token)
function decryptToken(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch (error) {
    console.error("Error decrypting token:", error);
    throw new Error("Failed to decrypt token");
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
    console.log("Token expired or expiring soon, refreshing...");

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
      throw new Error("Failed to refresh token");
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

    if (!supabaseUrl || !supabaseKey || !googleClientId || !googleClientSecret) {
      console.error("Missing environment variables");
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
      console.error("Error fetching email imports:", queryError);
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
          throw new Error(
            `Gmail API error: ${gmailResponse.status} ${gmailResponse.statusText}`
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
            const { data: existing } = await supabaseClient
              .from("imported_bills")
              .select("id")
              .eq("user_id", emailImport.user_id)
              .eq("gmail_message_id", message.id)
              .single();

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

            // Save imported bill record
            const { error: insertError } = await supabaseClient
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
              });

            if (insertError) {
              console.error(`Error saving imported bill:`, insertError);
            } else {
              console.log(`Imported bill: ${subject}`);
              syncedCount++;
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
        console.error(`Error syncing for user ${emailImport.user_id}:`, userError);
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
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
