import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { createActionToken, isWebChatSecurityConfigured, signIdentityToken } from "@/lib/assistant";

export const dynamic = "force-dynamic";

/**
 * POST /api/assistant/session
 * Lê a sessão do site e devolve ao navegador apenas o JWT de identidade do
 * Web Chat (o action token vai criptografado dentro dele) e dados públicos.
 */
export async function POST() {
  const user = await getCurrentUser();
  const action = user ? createActionToken(user.id) : null;

  const sub = user ? `reuse-${user.id}` : `anon-${crypto.randomUUID()}`;
  const identityToken = isWebChatSecurityConfigured()
    ? signIdentityToken(sub, action ? { reuse_action_token: action.token } : undefined)
    : null;

  return Response.json(
    {
      identityToken,
      context: {
        reuse_authenticated: Boolean(user && action),
        reuse_user_name: user?.name.split(" ")[0] ?? null,
        reuse_token_expires_at: action ? new Date(action.expiresAt * 1000).toISOString() : null,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
