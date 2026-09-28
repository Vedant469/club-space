import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders
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
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  if (req.method !== "POST") return json({
    error: "Method not allowed."
  }, 405);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({
        error: "Not authorized."
      }, 401);
    }
    const token = authHeader.slice("Bearer ".length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) {
      return json({
        error: "Not authorized."
      }, 401);
    }
    const body = await req.json();
    const clubId = typeof body?.club_id === "string" ? body.club_id : "";
    const targetUserId = typeof body?.user_id === "string" ? body.user_id : "";
    if (!clubId || !targetUserId) {
      return json({
        error: "Missing club or user."
      }, 400);
    }
    const { data: actorMember, error: actorError } = await admin.from("club_members").select("role").eq("club_id", clubId).eq("user_id", authData.user.id).maybeSingle();
    if (actorError || actorMember?.role !== "admin") {
      return json({
        error: "Only club admins can verify members."
      }, 403);
    }
    const { data: targetMember, error: targetError } = await admin.from("club_members").select("user_id").eq("club_id", clubId).eq("user_id", targetUserId).maybeSingle();
    if (targetError || !targetMember) {
      return json({
        error: "Club member not found."
      }, 404);
    }
    const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      email_confirm: true
    });
    if (updateError) {
      return json({
        error: "Could not verify this member."
      }, 500);
    }
    return json({
      verified: Boolean(updatedUser.user?.email_confirmed_at)
    });
  } catch  {
    return json({
      error: "Could not verify this member."
    }, 500);
  }
});
