# ReUse + IBM watsonx Orchestrate

## Caminho em uso (agente + ferramentas OpenAPI + chat incorporado)

A conta trial do Orchestrate não tem mais o "AI assistant builder"; o assistente do site é um **agente**:

1. **Criar agente** → nome `ReUse Assistente`; descrição e instruções em `agent-instructions.md`.
2. **Tools → Adicionar ferramenta → OpenAPI** → `reuse-public-tools.openapi.json` (operações `buscarItensDisponiveis` e `listarCategorias`, sem autenticação — rotas públicas na Vercel).
3. **Deploy** → Create version → Implantar → aba **Live** → **Embedded agent** → copiar os IDs do script.
4. IDs na Vercel: `NEXT_PUBLIC_WXO_ORCHESTRATION_ID`, `NEXT_PUBLIC_WXO_HOST_URL`, `NEXT_PUBLIC_WXO_AGENT_ID`, `NEXT_PUBLIC_WXO_AGENT_ENVIRONMENT_ID` → redeploy. Componente: `web/src/components/OrchestrateChat.tsx`.
5. **Settings → Embed Security**: Security desligado (o agente só lê dados públicos) e `https://reuse-web-ten.vercel.app` em *Allowed origins*.

Produção: https://reuse-web-ten.vercel.app

---

## Referência: fluxo com Web Chat seguro + Actions (guia original, watsonx Assistant clássico)

As rotas `/api/assistant/*` e o OpenAPI `reuse-assistant-extension.openapi.json` continuam no código para esse cenário (consultar/pausar/reativar anúncios do usuário logado, com JWT). Não estão em uso no deploy atual.


Fluxo: **Web Chat** → **Action** → **extensão OpenAPI** → **API Next.js na Vercel** → **Postgres** → resposta no chat.

| Arquivo | Função |
|---|---|
| `web/src/app/api/assistant/session/route.ts` | gera o JWT (RS256) com o action token criptografado no payload privado |
| `web/src/app/api/assistant/actions/items/*` | `summary` (GET), `pause` e `reactivate` (POST) |
| `web/src/lib/assistant.ts` | tokens, validação de headers e assinatura |
| `chatbot/orchestrate/reuse-assistant-extension.openapi.json` | contrato importado como extensão |
| `chatbot/orchestrate/action-catalog.json` | frases, respostas e fluxo de cada Action |

## 1. Gerar segredos (uma vez)

```bash
cd web
node scripts/generate-assistant-keys.mjs
```

Gera em `web/.assistant-keys/` (fora do git): `vercel-env.txt` (3 variáveis para a Vercel) e `web-chat-public.pem` (vai para a IBM).

## 2. Vercel

1. Cadastre em **Settings → Environment Variables (Production)**: `DATABASE_URL`, `AUTH_SECRET` e as 3 linhas de `vercel-env.txt`.
2. Faça o deploy e anote o domínio (`https://xxx.vercel.app`).
3. Troque `servers.url` no OpenAPI por esse domínio e faça commit/push.

## 3. IBM — assistente e extensão

1. watsonx Orchestrate → **AI Assistant Builder** → criar assistente em **Português (Brasil)**.
2. **Integrations → Extensions → Build custom extension** → importe `reuse-assistant-extension.openapi.json`.
3. Autenticação: **API key** no header `X-ReUse-Extension-Key` = valor de `ASSISTANT_EXTENSION_API_KEY`.
4. **Adicione** a extensão ao assistente (ambiente Draft).

## 4. IBM — Actions

Crie as 4 Actions de `action-catalog.json`. Em cada passo que chama a extensão, mapeie o parâmetro `X-ReUse-Action-Token` para a expressão:

```
${system_integrations.chat.private.user_payload}.reuse_action_token
```

Crie as variáveis de sessão `reuse_authenticated`, `reuse_user_name` e `reuse_token_expires_at` (o site as preenche a cada mensagem) e bloqueie as Actions privadas quando `reuse_authenticated` não for `true`. Pausar/reativar **sempre** pedem confirmação antes de chamar a API.

## 5. IBM — Web Chat

1. **Integrations → Web chat**: nome, saudação, cor.
2. **Embed**: copie `integrationID`, `region`, `serviceInstanceID` → variáveis `NEXT_PUBLIC_IBM_ASSISTANT_*` na Vercel.
3. **Security** → ative **Secure your web chat** → cole `web-chat-public.pem`.
4. Copie a **IBM provided public key** → variável `ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64` (aceita o PEM direto).
5. Crie uma versão do assistente e publique em **Live**. Depois faça **Redeploy** na Vercel.

## 6. Testes

1. Aba anônima: o botão do chat aparece e responde "como funciona o ReUse?".
2. Logado: "quais são meus anúncios?" → resumo.
3. "pausar meus anúncios" → responda **Não** → nada muda. Repita com **Sim** → somem do catálogo, aparecem como "Pausado" no perfil.
4. "reativar meus anúncios" → voltam ao catálogo.
5. Outra conta não enxerga os anúncios da primeira.

| Sintoma | Verificar |
|---|---|
| chat não aparece | variáveis `NEXT_PUBLIC_IBM_*` ausentes ou deploy antigo |
| 401 na extensão | API key da IBM ≠ `ASSISTANT_EXTENSION_API_KEY` |
| 403 | payload privado não mapeado, token expirado (1h) ou usuário deslogado |
| 404 | `servers.url` errado no OpenAPI |
| funciona no Draft e não no site | versão não publicada em Live |

O app **mobile** continua usando o proxy em `chatbot/proxy/` (Watson Assistant v2), que pode ser hospedado no Render com o `render.yaml` da raiz.
