// Função de administrador: criar utilizadores e repor senhas.
// Corre no servidor do Supabase (usa a chave de serviço, que NUNCA vai para o navegador).
// Só administradores activos a podem chamar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!token) return json(401, { error: "Sem sessão." });

  // 1. Quem está a chamar?
  const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: who, error: whoErr } = await caller.auth.getUser(token);
  if (whoErr || !who?.user) return json(401, { error: "Sessão inválida." });

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: me } = await admin.from("profiles").select("role,active").eq("id", who.user.id).single();
  if (!me || !me.active || me.role !== "admin") return json(403, { error: "Só administradores podem fazer isto." });

  // 2. O que se pede?
  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Pedido inválido." }); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "E-mail inválido." });
  if (password.length < 6) return json(400, { error: "A senha deve ter pelo menos 6 caracteres." });

  if (body.action === "create") {
    const name = String(body.name || "").trim().slice(0, 60) || email.split("@")[0];
    const role = body.role === "admin" ? "admin" : "tecnico";
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (error || !data?.user) {
      const dup = /already|registered|exists/i.test(error?.message || "");
      return json(400, { error: dup ? "Esse e-mail já existe." : "Não foi possível criar o utilizador." });
    }
    // o gatilho cria o perfil inactivo (só o primeiro utilizador fica administrador activo); aqui activamos
    const { error: pErr } = await admin.from("profiles").update({ role, name, active: true }).eq("id", data.user.id);
    if (pErr) return json(500, { error: "Utilizador criado, mas não foi possível definir o perfil." });
    return json(200, { ok: true });
  }

  if (body.action === "setPassword") {
    const { data: prof } = await admin.from("profiles").select("id").eq("email", email).single();
    if (!prof) return json(404, { error: "Utilizador não encontrado." });
    const { error } = await admin.auth.admin.updateUserById(prof.id, { password });
    if (error) return json(400, { error: "Não foi possível repor a senha." });
    return json(200, { ok: true });
  }

  return json(400, { error: "Acção desconhecida." });
});
