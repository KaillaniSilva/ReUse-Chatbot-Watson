# Assistente virtual do ReUse (IBM Watson Assistant)

Chatbot "Reuso" com duas frentes: **executar tarefas** na plataforma e **orientar o usuário**.

```
App (AssistantScreen)
   │  texto do usuário
   ▼
useAssistant ──► watsonClient ──► chatbot/proxy (Node) ──► IBM Watson Assistant
   │                  │ (sem proxy / offline)
   │                  └──► localNlu (mesmas intenções)
   ▼
assistantEngine ──► services/storage (AsyncStorage) / navegação
```

* O Watson identifica a **intenção** e devolve o texto + `output.user_defined.action`.
* O app executa a ação sobre os dados reais (`assistantEngine.ts`) e mostra o resultado.
* A API key fica só no proxy — nunca no app.
* Sem proxy configurado (ou se o Watson cair) o app usa o NLU local, com as mesmas intenções.

## 1. Tarefas automatizadas

| Peça ao bot | Ação executada |
|---|---|
| "Quero pausar minhas ofertas ativas" / "pausa o anúncio do sofá" | Pausa todas as ofertas ativas (ou só a citada) — ficam com ⏸ no Perfil |
| "Reativar minhas ofertas" | Reativa as ofertas pausadas |
| "Quais são minhas ofertas?" | Lista ofertas com status ativa/pausada |
| "Quero cadastrar um item" | Fluxo guiado (título → tipo → preço → categoria → estado → confirmação) e publica |
| "Excluir o anúncio da bicicleta" | Localiza a oferta, pede confirmação e exclui |
| "Mudar minha cidade para Campinas" | Atualiza a cidade do perfil |
| "Desativar / ativar notificações" | Altera a configuração de notificações push |
| "Qual é o meu progresso?" | Resume nível, RP, sequência, ofertas, trocas e doações |
| "Abrir favoritos / perfil / configurações" | Navega até a tela |

## 2. Orientações (passo a passo)

Como cadastrar um item · como funciona a troca · como doar · como falar com o anunciante ·
como favoritar · como ganhar pontos/níveis · dicas de segurança · como editar o perfil ·
o que é o ReUse · menu de ajuda.

Todas ficam em [`src/chatbot/data/intents.json`](../src/chatbot/data/intents.json) (intenções, exemplos de frases e respostas).

## 3. Configurar o IBM Watson Assistant

1. Crie uma instância do **watsonx Assistant** (plano Lite) na IBM Cloud.
2. Gere a skill: `node chatbot/watson/generate-skill.js` → cria `chatbot/watson/reuse-skill.json`.
   (`reuse-skill.json` já vem pronto no repositório.)
3. No Watson: **Dialog** → *Upload / Import* (ou *Actions/Dialog → Upload*) → selecione `reuse-skill.json`.
4. Em **Assistant settings → Assistant IDs and API details** copie *Assistant ID*, *Service instance URL* e a *API key*.
5. Configure o proxy:
   ```bash
   cd chatbot/proxy
   cp .env.example .env     # preencha WATSON_API_KEY, WATSON_URL, WATSON_ASSISTANT_ID
   node server.js           # http://localhost:3001  (teste: GET /health)
   ```
6. No app, crie `.env` na raiz (veja `.env.example`) com `EXPO_PUBLIC_WATSON_PROXY_URL` (use o IP da máquina no celular físico, `10.0.2.2` no emulador Android) e reinicie com `npx expo start -c`.

O cabeçalho do chat mostra **IBM Watson Assistant** quando a resposta veio do serviço e **Modo local** quando caiu no fallback.

## 4. Como testar

1. Entre no app → botão flutuante 🤖 (qualquer aba).
2. Publique um item (pela aba **+** ou conversando com o bot).
3. Digite *"quero pausar minhas ofertas ativas"* → veja o cartão de resultado e o ⏸ em **Perfil**.
4. Digite *"como cadastrar um novo item para troca?"* → passo a passo.

## 5. Arquivos

| Caminho | Papel |
|---|---|
| `src/screens/AssistantScreen.tsx` | Tela do chat |
| `src/chatbot/useAssistant.ts` | Orquestração da conversa |
| `src/chatbot/watsonClient.ts` | Chamada ao Watson (via proxy) + fallback |
| `src/chatbot/localNlu.ts` | Classificador local de intenções |
| `src/chatbot/assistantEngine.ts` | Execução das tarefas e fluxos multi-turno |
| `src/chatbot/data/intents.json` | Base única de intenções/respostas |
| `chatbot/watson/generate-skill.js` | Gera a skill do Watson a partir do JSON |
| `chatbot/proxy/server.js` | Proxy (guarda a API key, token IAM) |
