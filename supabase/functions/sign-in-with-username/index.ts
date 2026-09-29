import { createClient } from "npm:@supabase/supabase-js@2";
const ALLOWED_ORIGIN = "https://club-space-red.vercel.app";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json"
};
const GENERIC_ERROR = "Incorrect username or password.";
function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders
    }
  });
}
function firstKey(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch  {
    return null;
  }
}
async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte)=>byte.toString(16).padStart(2, "0")).join("");
}
function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKey = firstKey(Deno.env.get("SUPABASE_SECRET_KEYS")) ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const publishableKey = firstKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")) ?? Deno.env.get("SUPABASE_ANON_KEY");
if (!supabaseUrl || !secretKey || !publishableKey) {
  throw new Error("Supabase function credentials are not configured.");
}
const admin = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const authClient = createClient(supabaseUrl, publishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return json({
      error: GENERIC_ERROR
    }, 405);
  }
  try {
    const clientIp = getClientIp(req);
    const rateLimitKey = await sha256(`club-space:username-login:${clientIp}`);
    const { data: rateLimit, error: rateLimitError } = await admin.rpc("check_login_rate_limit", {
      _bucket_key: rateLimitKey,
      _max_attempts: 30,
      _window_seconds: 600
    });
    if (rateLimitError || !rateLimit?.[0]) {
      return json({
        error: "Service temporarily unavailable."
      }, 503);
    }
    if (!rateLimit[0].allowed) {
      return json({
        error: "Too many login attempts. Please try again later."
      }, 429, {
        "Retry-After": String(rateLimit[0].retry_after_seconds)
      });
    }
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) {
      return json({
        error: GENERIC_ERROR
      }, 400);
    }
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length === 0 || password.length > 1024) {
      return json({
        error: GENERIC_ERROR
      }, 401);
    }
    const { data: profile, error: profileError } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
    let email = "__invalid__@club-space.invalid";
    if (!profileError && profile?.id) {
      const { data: userData } = await admin.auth.admin.getUserById(profile.id);
      if (userData.user?.email) {
        email = userData.user.email;
      }
    }
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password
    });
    if (authError || !authData.session) {
      return json({
        error: GENERIC_ERROR
      }, 401);
    }
    return json({
      session: authData.session
    });
  } catch  {
    return json({
      error: GENERIC_ERROR
    }, 401);
  }
});
