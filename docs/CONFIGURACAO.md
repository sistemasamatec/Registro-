# Configuração (cerca de 15 minutos)

## 1. Criar o projecto Supabase (separado do ERP)
1. Em <https://supabase.com/dashboard> → **New project**. Nome sugerido: `amatec-oficina`. Escolhe a região mais próxima e guarda a senha da base de dados.
2. Espera o projecto ficar pronto.

## 2. Criar as tabelas e as regras de acesso
1. **SQL Editor** → **New query**.
2. Cola todo o conteúdo de `supabase/migrations/0001_init.sql` e carrega em **Run**. Pode ser executado mais de uma vez sem estragar nada.

## 3. Fechar os registos abertos
**Authentication → Sign In / Providers** (ou *Settings*): desliga **Allow new users to sign up**.
Assim só o administrador cria contas. (Mesmo que fique ligado, quem se registar sozinho fica **inactivo** e não vê nenhum dado.)

## 4. Criar o administrador
1. **Authentication → Users → Add user → Create new user**.
2. Escreve o e-mail e a senha e marca **Auto Confirm User**.
3. O **primeiro** utilizador criado fica automaticamente **administrador**. Os seguintes ficam técnicos (e o administrador pode mudar o perfil dentro da app).

## 5. Publicar a função de administrador
A função `admin-users` permite ao administrador criar técnicos e repor senhas dentro da app.

**Pelo painel:** *Edge Functions → Deploy a new function → Via Editor*, nome `admin-users`, cola o ficheiro `supabase/functions/admin-users/index.ts` e faz **Deploy**.
(Mantém activa a opção *Verify JWT*. As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente no servidor.)

**Pela CLI:** `supabase link --project-ref <ref>` e `supabase functions deploy admin-users`.

## 6. Ligar a página ao Supabase
1. **Project Settings → API**: copia o **Project URL** e a chave **anon public**.
2. Edita `site/config.js` (pode ser no GitHub: lápis → *Commit changes*):
   ```js
   window.AMATEC_CONFIG = { url: "https://xxxx.supabase.co", anonKey: "eyJ..." };
   ```
   Não uses a chave `service_role`.

## 7. Publicar no GitHub Pages
1. Repositório → **Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**.
2. Faz commit em `main` (o workflow `.github/workflows/pages.yml` publica a pasta `site/`).
3. O endereço fica em **Settings → Pages** (algo como `https://sistemasamatec.github.io/Registro-/`).
4. No Supabase, **Authentication → URL Configuration → Site URL**: coloca esse endereço.

## 8. Primeiro uso
Abre o endereço, entra com o e-mail do administrador, vai a **Administração** e cria as contas dos técnicos.

## Passar os dados do artefacto do Claude para aqui
No artefacto: **Administração → Exportar cópia completa (JSON)**. Na nova página, como administrador: **Administração → Importar cópia**. A numeração continua a seguir ao maior número importado.

## Cópias de segurança
**Administração → Exportar** (CSV ou JSON) quando quiseres. O Supabase também faz cópias automáticas nos planos pagos.
