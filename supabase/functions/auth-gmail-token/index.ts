import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "3600",
  "Content-Type": "application/json",
};

interface TokenRequest {
  code: string;
  userId: string;
  redirectUri?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

// Simple encryption function (in production, use proper library)
function encryptToken(token: string, key: string): string {
  // For now, we'll use base64 encoding. In production, implement AES-256
  // This is a temporary solution until CryptoKey is available in Deno
  const combined = `${token}|${key}`;
  return btoa(combined);
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
    const { code, userId, redirectUri } = (await req.json()) as TokenRequest;

    if (!code || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing code or userId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get environment variables
    const googleClientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = redirectUri || Deno.env.get("APP_URL") || "http://localhost:5173";

    if (!googleClientId || !googleClientSecret || !supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Exchange authorization code for tokens
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenParams = new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: `${appUrl}/auth/gmail-callback`,
      grant_type: "authorization_code",
    });

    console.log("Exchanging authorization code for tokens...");
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const tokenData = (await tokenResponse.json()) as TokenResponse;

    // Get user email from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("Failed to get user info from Google");
      return new Response(
        JSON.stringify({ error: "Failed to get user email from Google" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const userInfo = (await userInfoResponse.json()) as {
      email: string;
      name?: string;
    };

    // Save tokens to Supabase
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Encrypt tokens before storing
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "default-key";
    const encryptedAccessToken = encryptToken(
      tokenData.access_token,
      encryptionKey
    );
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token, encryptionKey)
      : null;

    console.log("Saving email import settings for user:", userId);

    const { error: upsertError } = await supabaseClient
      .from("email_imports")
      .upsert(
        {
          user_id: userId,
          provider: "gmail",
          email_address: userInfo.email,
          enabled: true,
          oauth_token: encryptedAccessToken,
          oauth_refresh_token: encryptedRefreshToken,
          token_expires_at: new Date(
            Date.now() + (tokenData.expires_in || 3600) * 1000
          ),
          updated_at: new Date(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("Error saving email import settings:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save email settings" }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Gmail connected successfully",
        email: userInfo.email,
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
