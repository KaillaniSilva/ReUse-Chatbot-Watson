/**
 * Gera o arquivo de skill do IBM Watson Assistant (dialog skill) a partir de
 * src/chatbot/data/intents.json — a mesma base usada pelo app.
 *
 * Uso:   node chatbot/watson/generate-skill.js
 * Saída: chatbot/watson/reuse-skill.json  (importe no Watson Assistant)
 *
 * Cada intenção vira: 1 intent (com exemplos) + 1 nó de dialog.
 * Nós de TAREFA enviam `output.user_defined.action`, que o app lê para
 * executar a ação (pausar ofertas, cadastrar item etc.).
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "src", "chatbot", "data", "intents.json");
const out = path.join(__dirname, "reuse-skill.json");
const kb = JSON.parse(fs.readFileSync(src, "utf8"));

const intents = kb.intents.map((i) => ({
  intent: i.name,
  description: `${i.kind}: ${i.name}`,
  examples: i.examples.map((text) => ({ text })),
}));

const nodes = [];
let previous = null;

function addNode(node) {
  if (previous) node.previous_sibling = previous;
  nodes.push(node);
  previous = node.dialog_node;
}

function genericFor(text, quickReplies) {
  const generic = [
    { response_type: "text", selection_policy: "sequential", values: [{ text }] },
  ];
  if (quickReplies && quickReplies.length) {
    generic.push({
      response_type: "option",
      title: "Posso ajudar com:",
      preference: "button",
      options: quickReplies.map((label) => ({
        label,
        value: { input: { text: label } },
      })),
    });
  }
  return generic;
}

// Boas-vindas
addNode({
  type: "standard",
  title: "Boas-vindas",
  dialog_node: "welcome",
  conditions: "welcome",
  output: { generic: genericFor(kb.welcome, ["Pausar minhas ofertas", "Cadastrar um item", "Como funciona a troca?"]) },
});

// Uma regra por intenção
for (const i of kb.intents) {
  const output = { generic: genericFor(i.answer, i.quickReplies) };
  if (i.kind === "task") {
    output.user_defined = { action: i.action || i.name };
  }
  addNode({
    type: "standard",
    title: i.name,
    dialog_node: `node_${i.name}`,
    conditions: `#${i.name}`,
    output,
  });
}

// Fallback — precisa ser o último nó
addNode({
  type: "standard",
  title: "Em outros casos",
  dialog_node: "anything_else",
  conditions: "anything_else",
  output: { generic: genericFor(kb.fallback) },
});

const skill = {
  name: "ReUse - Assistente virtual",
  description: "Assistente do ReUse: executa tarefas (pausar ofertas, cadastrar item...) e orienta o uso da plataforma.",
  language: "pt-br",
  metadata: { api_version: { major_version: "v1", minor_version: "2018-09-20" } },
  intents,
  entities: [],
  counterexamples: [],
  dialog_nodes: nodes,
  webhooks: [],
  system_settings: { disambiguation: { enabled: false } },
  learning_opt_out: true,
};

fs.writeFileSync(out, JSON.stringify(skill, null, 2), "utf8");
console.log(`OK: ${intents.length} intents, ${nodes.length} nós → ${out}`);
