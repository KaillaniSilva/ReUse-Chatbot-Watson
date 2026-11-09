// Gera os segredos e o par de chaves RSA do Web Chat (equivalente aos comandos openssl do guia).
// Uso (dentro de web/): node scripts/generate-assistant-keys.mjs
// Saída em web/.assistant-keys/ (ignorada pelo git). NUNCA comite esses arquivos.
import crypto from "crypto";
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), ".assistant-keys");
fs.mkdirSync(dir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.writeFileSync(path.join(dir, "web-chat-private.pem"), privateKey);
fs.writeFileSync(path.join(dir, "web-chat-public.pem"), publicKey);

const env = [
  `ASSISTANT_ACTION_SECRET="${crypto.randomBytes(32).toString("hex")}"`,
  `ASSISTANT_EXTENSION_API_KEY="${crypto.randomBytes(32).toString("hex")}"`,
  `ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64="${Buffer.from(privateKey).toString("base64")}"`,
].join("\n");
fs.writeFileSync(path.join(dir, "vercel-env.txt"), env + "\n");

console.log(`Arquivos gerados em ${dir}:
  web-chat-public.pem  -> colar na IBM: Web chat > Security > "Your public key"
  vercel-env.txt       -> variáveis para cadastrar na Vercel (Production)
O valor de ASSISTANT_EXTENSION_API_KEY também vai na autenticação da extensão IBM.`);
