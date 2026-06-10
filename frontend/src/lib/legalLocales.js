/** Banner de consentimento + páginas legais. */

const en = {
  consent_title: "Cookies & terms",
  consent_body:
    "We use essential cookies to keep you signed in and remember preferences. By continuing, you accept our Terms of Use and Privacy Policy.",
  consent_accept: "Accept",
  consent_terms: "Terms of use",
  consent_privacy: "Privacy",
  consent_cookies: "Cookies",
  footer_terms: "Terms",
  footer_privacy: "Privacy",
  footer_cookies: "Cookies",
  legal_page_title: "Legal",
  legal_terms_title: "Terms of use",
  legal_privacy_title: "Privacy policy",
  legal_cookies_title: "Cookie policy",
  legal_updated: "Last updated: May 2026",
  legal_terms_1:
    "Remake Pixel is an AI image and video studio. You must be 18+ (or the legal age in your country) to use paid features.",
  legal_terms_2:
    "Credits are digital. Paid packages are generally non-refundable in cash after purchase, except where the law requires otherwise.",
  legal_terms_3:
    "Each generation debits the cost shown in the tool. Successful deliveries are final. Failed generations (server error, timeout, empty output, model block) are refunded automatically.",
  legal_terms_4:
    "You are responsible for prompts and uploads. Do not use the service for illegal content or to violate third-party rights.",
  legal_terms_5: "Billing questions: suporte@remakepix.com",
  legal_privacy_1:
    "We process account data (email, name), usage (generations, credits), and files you upload to run AI models and store results.",
  legal_privacy_2:
    "We use processors (hosting, AI APIs, payments). We do not sell your personal data.",
  legal_privacy_3:
    "You may request access or deletion of your account by emailing suporte@remakepix.com.",
  legal_cookies_1:
    "Essential: session token (rp_token), settings (rp_settings), language, legal consent, and pending generation state.",
  legal_cookies_2:
    "We do not use third-party advertising cookies on the studio.",
  wa_settings_title: "WhatsApp alerts",
  wa_settings_desc:
    "When a generation finishes, you can open WhatsApp with a ready-made message. True push notifications to your number require WhatsApp Business API (Meta) — we are preparing that integration.",
  wa_phone_label: "Your WhatsApp number (with country code)",
  wa_phone_ph: "e.g. 351912345678",
  wa_enable: "Suggest WhatsApp when a generation completes",
  wa_saved: "WhatsApp preferences saved.",
  wa_save_btn: "Save number",
  wa_invalid_phone: "Enter a valid number with country code (digits only).",
  wa_toast_title: "Generation ready",
  wa_toast_action: "Open in WhatsApp",
  wa_toast_skip: "Not now",
};

const pt = {
  consent_title: "Cookies e termos",
  consent_body:
    "Usamos cookies essenciais para manter a sessão e as tuas preferências. Ao continuar, aceitas os Termos de Utilização e a Política de Privacidade.",
  consent_accept: "Aceitar",
  consent_terms: "Termos de utilização",
  consent_privacy: "Privacidade",
  consent_cookies: "Cookies",
  footer_terms: "Termos",
  footer_privacy: "Privacidade",
  footer_cookies: "Cookies",
  legal_page_title: "Informação legal",
  legal_terms_title: "Termos de utilização",
  legal_privacy_title: "Política de privacidade",
  legal_cookies_title: "Política de cookies",
  legal_updated: "Última atualização: maio de 2026",
  legal_terms_1:
    "O Remake Pixel é um estúdio de imagem e vídeo com IA. Deves ter 18+ anos (ou a idade legal no teu país) para usar funções pagas.",
  legal_terms_2:
    "Os créditos são digitais. Os pacotes pagos, em regra, não são reembolsáveis em dinheiro após a compra, salvo quando a lei o exigir.",
  legal_terms_3:
    "Cada geração debita o custo indicado na ferramenta. Entregas com sucesso são definitivas. Falhas (erro do servidor, timeout, saída vazia, bloqueio do modelo) são reembolsadas automaticamente.",
  legal_terms_4:
    "És responsável pelos prompts e uploads. Não uses o serviço para conteúdo ilegal nem para violar direitos de terceiros.",
  legal_terms_5: "Dúvidas: suporte@remakepix.com",
  legal_privacy_1:
    "Tratamos dados de conta (email, nome), utilização (gerações, créditos) e ficheiros que envias para executar modelos de IA e guardar resultados.",
  legal_privacy_2:
    "Usamos subprocessadores (alojamento, APIs de IA, pagamentos). Não vendemos os teus dados pessoais.",
  legal_privacy_3:
    "Podes pedir acesso ou eliminação da conta em suporte@remakepix.com.",
  legal_cookies_1:
    "Essenciais: token de sessão (rp_token), definições (rp_settings), idioma, consentimento legal e estado de gerações pendentes.",
  legal_cookies_2:
    "Não usamos cookies de publicidade de terceiros no estúdio.",
  wa_settings_title: "Alertas WhatsApp",
  wa_settings_desc:
    "Quando uma geração termina, podes abrir o WhatsApp com uma mensagem pronta. Notificações automáticas no teu número exigem a API WhatsApp Business (Meta) — estamos a preparar essa integração.",
  wa_phone_label: "O teu número WhatsApp (com indicativo)",
  wa_phone_ph: "ex.: 351912345678",
  wa_enable: "Sugerir WhatsApp quando uma geração terminar",
  wa_saved: "Preferências WhatsApp guardadas.",
  wa_save_btn: "Guardar número",
  wa_invalid_phone: "Introduz um número válido com indicativo (só dígitos).",
  wa_toast_title: "Geração pronta",
  wa_toast_action: "Abrir no WhatsApp",
  wa_toast_skip: "Agora não",
};

export function mergeLegalLocales(dict) {
  Object.assign(dict.en, en);
  Object.assign(dict.pt, pt);
  Object.assign(dict.es, { ...en, ...dict.es });
  Object.assign(dict.fr, { ...en, ...dict.fr });
}
