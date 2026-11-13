# Registro — AMA TEC · Oficina

Aplicação da **AMA TEC** para a oficina: **clientes**, **equipamentos**, **ordens de serviço** e **relatórios técnicos** (com PDF e logótipo), com login por perfil (administrador / técnico).

É um projecto **separado do ERP AmaTec 365**: tem o seu próprio projecto Supabase, utilizadores e dados.

## Como funciona

| Parte | Onde |
|---|---|
| Página (HTML, sem bibliotecas externas) | `site/index.html` → publicada no **GitHub Pages** |
| Ligação ao Supabase (URL e chave pública) | `site/config.js` |
| Base de dados, regras de acesso (RLS) e numeração | `supabase/migrations/0001_init.sql` |
| Criar utilizadores e repor senhas | `supabase/functions/admin-users/` (Edge Function) |
| Código-fonte da página | `src/parts/` + `src/build.py` |

- Números automáticos: `CL-0001` (cliente), `EQ-0001` (equipamento), `OS-0001` (ordem), e por tipo nos relatórios (`MLR-0001`, `TV-0001`, `FOG-0001`…). A numeração é feita no servidor e nunca repete.
- **Início** com resumo (ordens em curso, equipamentos na oficina, ordens por assinar, relatórios do mês) e atalhos.
- **Assinatura do cliente no ecrã** (dedo ou rato) nas ordens de serviço e nos relatórios; aparece no PDF.
- **Eliminar** registos: só administradores (pede confirmação com um segundo toque). Os técnicos criam e editam.
- Perfis: o **administrador** gere utilizadores e cópias de segurança; o **técnico** usa clientes, equipamentos, ordens e relatórios.
- Cada pessoa precisa de e-mail e senha. Sem sessão, a base de dados não devolve nada.

## Instalar

Passo a passo em **[docs/CONFIGURACAO.md](docs/CONFIGURACAO.md)**.

## Segurança

- O repositório pode ser público: não contém dados nem segredos. O `anonKey` do Supabase é público por desenho; quem protege os dados são as regras RLS do `0001_init.sql` e o login.
- **Nunca** coloques a chave `service_role` no repositório nem em `site/`.
- Desactive os registos abertos no Supabase (passo 3 da configuração), para só o administrador criar contas.

## Regenerar a página

```bash
cd src
python3 build.py cloud   # escreve ../site/index.html
```
