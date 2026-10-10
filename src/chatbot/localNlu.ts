/**
 * localNlu.ts
 * Classificador de intenções local (fallback do IBM Watson).
 *
 * Funciona por similaridade (coeficiente de Dice) entre os tokens da
 * frase do usuário e os exemplos de cada intenção + bônus por palavras-chave.
 * Usa exatamente as mesmas intenções/exemplos enviados ao Watson, então o
 * comportamento do app é equivalente com ou sem conexão com o serviço.
 */

import { INTENTS, toQuickReplies } from "./knowledge";
import type { NluResult } from "./types";
import { MIN_CONFIDENCE } from "./config";

const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos",
  "em", "no", "na", "nos", "nas", "para", "pra", "por", "e", "que", "eu", "me",
  "meu", "meus", "minha", "minhas", "com", "se", "quero", "queria", "voce", "vc",
  "ao", "ou", "mais", "tem", "ter", "so", "ja", "la", "isso", "esse", "essa",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

function dice(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const inter = new Set(a.filter((t) => setB.has(t))).size;
  return (2 * inter) / (new Set(a).size + setB.size);
}

function containsPhrase(normalizedText: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  return ` ${normalizedText} `.includes(` ${p} `);
}

export function classifyLocal(text: string): NluResult {
  const normalized = normalize(text);
  const userTokens = tokenize(text);
  const isQuestion = /\b(como|onde|qual|quais|o que|por que)\b/.test(normalized);

  let best: { name: string; score: number } = { name: "", score: 0 };

  for (const intent of INTENTS) {
    let score = 0;
    for (const example of intent.examples) {
      score = Math.max(score, dice(userTokens, tokenize(example)));
    }
    if (intent.keywords.some((k) => containsPhrase(normalized, k))) {
      score += 0.35;
    }
    if (isQuestion && intent.kind === "help") score += 0.1;
    if (isQuestion && intent.kind === "task") score *= 0.8;

    // Compara o score "cru" (sem teto) para desempatar intenções que
    // empatariam em 1.0 — a que também casa palavra-chave vence.
    if (score > best.score) best = { name: intent.name, score };
  }

  const confidence = Math.min(1, best.score);
  if (confidence < MIN_CONFIDENCE) {
    return { intent: null, confidence, source: "local" };
  }

  const def = INTENTS.find((i) => i.name === best.name)!;
  return {
    intent: def.name,
    confidence,
    reply: def.answer,
    quickReplies: toQuickReplies(def.quickReplies),
    action: def.action,
    source: "local",
  };
}
