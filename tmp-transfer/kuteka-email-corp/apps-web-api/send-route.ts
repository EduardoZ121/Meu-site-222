import { NextResponse } from 'next/server';
import { sendTransactional } from '@kuteka/email';

export const dynamic = 'force-dynamic';

/**
 * Internal transactional send hook (server-only).
 * Auth: Authorization: Bearer $KUTEKA_MAIL_HOOK_SECRET
 * Body: { kind, to, vars? }
 */
export async function POST(req: Request) {
  const secret = process.env.KUTEKA_MAIL_HOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, message: 'mail hook not configured' }, { status: 503 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 });
  }

  let body: { kind?: string; to?: string; vars?: Record<string, string> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'invalid json' }, { status: 400 });
  }

  const kind = body.kind;
  const to = body.to?.trim();
  if (!kind || !to) {
    return NextResponse.json({ ok: false, message: 'kind and to required' }, { status: 400 });
  }

  const allowed = new Set([
    'account_confirmation',
    'password_recovery',
    'order_confirmation',
    'order_update',
    'generic_notification',
  ]);
  if (!allowed.has(kind)) {
    return NextResponse.json({ ok: false, message: 'invalid kind' }, { status: 400 });
  }

  const result = await sendTransactional(
    kind as
      | 'account_confirmation'
      | 'password_recovery'
      | 'order_confirmation'
      | 'order_update'
      | 'generic_notification',
    to,
    body.vars || {},
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
