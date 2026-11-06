// Supabase Edge Function "send-push" – Denisegram
// Erzeugt die Push-Schlüssel (VAPID) beim ersten Aufruf selbst und speichert sie in app_keys.
// Aufruf aus der App: { space_id, kind, title, body, tag, to }  ·  to = 'all' | <pid>  ·  self:true = Test an mich
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let { data: k } = await admin.from("app_keys").select("*").eq("id", "vapid").maybeSingle();
    if (!k) {
      const v = webpush.generateVAPIDKeys();
      await admin.from("app_keys").upsert({ id: "vapid", public_key: v.publicKey, private_key: v.privateKey });
      ({ data: k } = await admin.from("app_keys").select("*").eq("id", "vapid").single());
    }

    const body = await req.json().catch(() => ({}));
    if (body.action === "key") return json({ publicKey: k.public_key });

    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "auth" }, 401);

    // Absender = Gerät → Person (aktiv, nicht entfernt)
    const { data: m } = await admin.from("members").select("pid, people!inner(id, removed_at)")
      .eq("space_id", body.space_id).eq("user_id", u.user.id).is("people.removed_at", null).maybeSingle();
    if (!m) return json({ error: "forbidden" }, 403);
    const me = m.pid as string;

    // Ziele bestimmen
    let targets: string[] = [];
    if (body.self) targets = [me];
    else {
      const { data: act } = await admin.from("people").select("id").eq("space_id", body.space_id).is("removed_at", null);
      const active = (act ?? []).map((p: { id: string }) => p.id).filter((id: string) => id !== me);
      if (body.to === "all") targets = active;
      else if (typeof body.to === "string" && active.includes(body.to)) targets = [body.to];
    }
    if (!targets.length) return json({ sent: 0 });

    const { data: subs } = await admin.from("push_subs").select("*")
      .eq("space_id", body.space_id).in("role", targets);

    webpush.setVapidDetails("mailto:je@ebbing-project.de", k.public_key, k.private_key);
    const payload = JSON.stringify({
      title: String(body.title || "Denisegram").slice(0, 120),
      body: String(body.body || "").slice(0, 240),
      kind: body.kind || "info", tag: "dg-" + String(body.tag || body.kind || "info").slice(0, 30),
    });
    let sent = 0;
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.sub, payload, { TTL: 3600, urgency: "normal" });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
    return json({ sent });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
