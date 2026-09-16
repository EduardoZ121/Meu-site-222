import type { TransactionalKind } from './types';

const BRAND = 'Kuteka';
const APP_URL = 'https://kutekalink.com';

function wrap(title: string, bodyHtml: string, bodyText: string) {
  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${BRAND}</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0f172a;">${title}</h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">© Kuteka · Angola · <a href="${APP_URL}" style="color:#64748b;">kutekalink.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${BRAND}\n\n${title}\n\n${bodyText}\n\n—\nKuteka · ${APP_URL}\n`;
  return { html, text };
}

export function renderTransactionalEmail(
  kind: TransactionalKind,
  vars: Record<string, string>,
): { subject: string; html: string; text: string } {
  switch (kind) {
    case 'account_confirmation': {
      const link = vars.actionUrl || APP_URL;
      const code = vars.otpCode || '';
      const { html, text } = wrap(
        'Confirme o seu email',
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">Bem-vindo à Kuteka. Confirme o email para activar a conta.</p>
         <p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Confirmar email</a></p>
         ${code ? `<p style="margin:0;font-size:14px;color:#475569;">Ou introduza o código: <strong style="font-family:ui-monospace,monospace;letter-spacing:0.12em;">${code}</strong></p>` : ''}`,
        `Bem-vindo à Kuteka. Confirme o email: ${link}${code ? `\nCódigo: ${code}` : ''}`,
      );
      return { subject: 'Confirme o seu email — Kuteka', html, text };
    }
    case 'password_recovery': {
      const link = vars.actionUrl || APP_URL;
      const { html, text } = wrap(
        'Recuperação de acesso',
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">Recebemos um pedido para redefinir a palavra-passe.</p>
         <p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Redefinir palavra-passe</a></p>
         <p style="margin:0;font-size:13px;color:#64748b;">Se não pediu isto, ignore este email.</p>`,
        `Redefina a palavra-passe: ${link}\nSe não pediu isto, ignore este email.`,
      );
      return { subject: 'Recuperação de acesso — Kuteka', html, text };
    }
    case 'order_confirmation': {
      const ref = vars.reference || '';
      const { html, text } = wrap(
        'Pedido confirmado',
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">O seu pedido foi registado${ref ? ` (ref. <strong>${ref}</strong>)` : ''}.</p>
         <p style="margin:0;font-size:14px;color:#475569;">Acompanhe o estado em <a href="${APP_URL}/app/" style="color:#0f766e;">Minha conta</a>.</p>`,
        `Pedido confirmado${ref ? ` (ref. ${ref})` : ''}. Acompanhe em ${APP_URL}/app/`,
      );
      return { subject: `Pedido confirmado${ref ? ` ${ref}` : ''} — Kuteka`, html, text };
    }
    case 'order_update': {
      const status = vars.status || 'actualizado';
      const ref = vars.reference || '';
      const { html, text } = wrap(
        'Actualização do pedido',
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">O pedido${ref ? ` <strong>${ref}</strong>` : ''} está agora: <strong>${status}</strong>.</p>`,
        `Pedido${ref ? ` ${ref}` : ''} actualizado: ${status}`,
      );
      return { subject: `Actualização do pedido — Kuteka`, html, text };
    }
    default: {
      const title = vars.title || 'Notificação Kuteka';
      const body = vars.body || '';
      const { html, text } = wrap(
        title,
        `<p style="margin:0;font-size:15px;line-height:1.55;color:#334155;white-space:pre-wrap;">${body}</p>`,
        body,
      );
      return { subject: `${title} — Kuteka`, html, text };
    }
  }
}
