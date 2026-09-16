export type TransactionalKind =
  | 'account_confirmation'
  | 'password_recovery'
  | 'order_confirmation'
  | 'order_update'
  | 'generic_notification';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Defaults to configured transactional from */
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  /** Resend idempotency key */
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; message: string; code?: string };

export type MailerConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};
