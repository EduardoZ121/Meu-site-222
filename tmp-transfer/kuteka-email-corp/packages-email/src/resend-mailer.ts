import type { MailerConfig, SendEmailInput, SendEmailResult } from './types';

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Thin Resend HTTP client — no extra npm dependency.
 * Secrets must come from env (RESEND_API_KEY); never hardcode.
 */
export function createResendMailer(config: MailerConfig) {
  if (!config.apiKey?.trim()) {
    throw new Error('RESEND_API_KEY missing');
  }
  if (!config.from?.trim()) {
    throw new Error('Transactional from address missing');
  }

  return {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      const to = Array.isArray(input.to) ? input.to : [input.to];
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      };
      if (input.idempotencyKey) {
        headers['Idempotency-Key'] = input.idempotencyKey;
      }

      try {
        const res = await fetch(RESEND_API, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            from: input.from ?? config.from,
            to,
            subject: input.subject,
            html: input.html,
            text: input.text,
            reply_to: input.replyTo ?? config.replyTo,
            tags: input.tags,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
          name?: string;
        };
        if (!res.ok) {
          return {
            ok: false,
            code: body.name || String(res.status),
            message: body.message || `Resend HTTP ${res.status}`,
          };
        }
        if (!body.id) {
          return { ok: false, message: 'Resend response missing id' };
        }
        return { ok: true, id: body.id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'network error';
        return { ok: false, code: 'network', message: msg };
      }
    },
  };
}

export type ResendMailer = ReturnType<typeof createResendMailer>;
