import { createResendMailer } from './resend-mailer';
import { renderTransactionalEmail } from './templates';
import type { SendEmailResult, TransactionalKind } from './types';

export * from './types';
export { createResendMailer } from './resend-mailer';
export { renderTransactionalEmail } from './templates';

/** Canonical Beta transactional identity */
export const TRANSACTIONAL_FROM_DEFAULT = 'Kuteka <noreply@mail.kutekalink.com>';
export const TRANSACTIONAL_DOMAIN = 'mail.kutekalink.com';
export const HUMAN_FORWARD_DESTINATION = 'vicentemakiese81@gmail.com';

export const HUMAN_ADDRESSES = [
  'info@kutekalink.com',
  'support@kutekalink.com',
  'partnerships@kutekalink.com',
  'contacto@kutekalink.com',
  'privacidade@kutekalink.com',
  'juridico@kutekalink.com',
] as const;

export function getMailerFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  const from = env.RESEND_FROM?.trim() || TRANSACTIONAL_FROM_DEFAULT;
  const replyTo = env.RESEND_REPLY_TO?.trim() || 'contacto@kutekalink.com';
  return createResendMailer({ apiKey, from, replyTo });
}

export async function sendTransactional(
  kind: TransactionalKind,
  to: string,
  vars: Record<string, string> = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<SendEmailResult> {
  const mailer = getMailerFromEnv(env);
  if (!mailer) {
    return { ok: false, code: 'config', message: 'RESEND_API_KEY not configured' };
  }
  const rendered = renderTransactionalEmail(kind, vars);
  return mailer.send({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [{ name: 'kind', value: kind }],
    idempotencyKey: vars.idempotencyKey,
  });
}
