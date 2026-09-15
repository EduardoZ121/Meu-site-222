import { describe, expect, it } from 'vitest';
import { HUMAN_ADDRESSES, renderTransactionalEmail, TRANSACTIONAL_FROM_DEFAULT } from './index';

describe('email templates', () => {
  it('renders confirmation with link and otp', () => {
    const mail = renderTransactionalEmail('account_confirmation', {
      actionUrl: 'https://kutekalink.com/auth/verificar/',
      otpCode: '123456',
    });
    expect(mail.subject).toContain('Confirme');
    expect(mail.html).toContain('123456');
    expect(mail.text).toContain('https://kutekalink.com/auth/verificar/');
  });

  it('renders password recovery', () => {
    const mail = renderTransactionalEmail('password_recovery', {
      actionUrl: 'https://kutekalink.com/auth/recuperar/confirmar/',
    });
    expect(mail.subject).toContain('Recuperação');
    expect(mail.html).toContain('Redefinir');
  });

  it('exposes human addresses and from default', () => {
    expect(HUMAN_ADDRESSES).toContain('contacto@kutekalink.com');
    expect(TRANSACTIONAL_FROM_DEFAULT).toContain('noreply@mail.kutekalink.com');
  });
});
