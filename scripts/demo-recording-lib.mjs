/** Shared helpers for marketing demo recordings (no real API / no error toasts). */

export const DEMO_EMAIL = "demo@remakepix.com";
export const DEMO_PASSWORD = "studio2026";

const MOCK_PREDICTION_ID = "demo_marketing_pred_001";

export async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function demoImageUrl(base) {
  const b = base.replace(/\/$/, "");
  return `${b}/images/generate.jpg`;
}

/** Mock generate + poll so clicking Generate never shows API errors. */
export async function setupDemoApiMocks(context, baseUrl) {
  const resultUrl = demoImageUrl(baseUrl);

  const fulfillJson = (route, body, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

  await context.route(/\/api\/generate\/image$/i, (route) =>
    fulfillJson(route, {
      prediction_id: MOCK_PREDICTION_ID,
      credits_spent: 5,
    }),
  );

  await context.route(/\/api\/generate\/(easy|edit)$/i, (route) =>
    fulfillJson(route, {
      prediction_id: MOCK_PREDICTION_ID,
      credits_spent: 8,
    }),
  );

  const pollSuccess = {
    status: "succeeded",
    elapsed_seconds: 3,
    creation: {
      id: "demo_creation_1",
      type: "image",
      credits_spent: 5,
      result_urls: [resultUrl],
      thumbnail_url: resultUrl,
    },
    new_balance: 415,
  };

  await context.route(/\/api\/predictions\//i, (route) => fulfillJson(route, pollSuccess));
}

export async function injectDemoAccount(context) {
  await context.addInitScript(({ email, password }) => {
    localStorage.setItem("rp_lang", "en");
    localStorage.setItem("rp_recording_demo", "1");
    localStorage.setItem("rp_local_users", JSON.stringify({
      [email]: {
        id: "tutorial_demo",
        email,
        name: "Alex",
        password,
        role: "user",
        credits: 420,
        referral_code: "DEMO",
        email_verified: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
    }));
    localStorage.setItem("rp_settings", JSON.stringify({
      aspect_ratio_default: "4:5",
      num_variations_default: 1,
      quality: "balanced",
      generation_mode: "balanced",
      personality: "professional",
      lang: "en",
      notifications: true,
    }));
  }, { email: DEMO_EMAIL, password: DEMO_PASSWORD });
}

export async function injectDemoSessionLoggedIn(context) {
  await context.addInitScript(({ email, password }) => {
    localStorage.setItem("rp_lang", "en");
    localStorage.setItem("rp_recording_demo", "1");
    const user = {
      id: "tutorial_demo",
      email,
      name: "Alex",
      password,
      role: "user",
      credits: 420,
      referral_code: "DEMO",
      email_verified: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("rp_local_users", JSON.stringify({ [email]: user }));
    localStorage.setItem("rp_token", "local:tutorial_demo");
    localStorage.setItem("rp_user", JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: "user",
      lang: "en",
      credits: 420,
      is_unlimited: false,
      referral_code: "DEMO",
      email_verified: true,
      avatar_url: null,
      created_at: user.created_at,
      pricing_region: "intl",
    }));
  }, { email: DEMO_EMAIL, password: DEMO_PASSWORD });
}

/** Hide Sonner toasts so failed-network messages never appear on video. */
export async function injectHideToasts(page) {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.id = "rp-hide-demo-toasts";
    style.textContent = `
      [data-sonner-toaster],
      [data-sonner-toast],
      li[data-sonner-toast],
      section[aria-label="Notifications"] {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        max-height: 0 !important;
      }
    `;
    document.head.appendChild(style);
  });
}

export async function dismissVisibleToasts(page) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-sonner-toast], [data-sonner-toaster] button").forEach((el) => {
      el.remove();
    });
  }).catch(() => {});
}

export const CURSOR_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#FFFFFF" stroke="#1a1a1a" stroke-width="1.25" d="M5 3l12 8.5-6.2 1.2 2.8 7.3-2.8 1.2-2.8-7.3L5 19z"/></svg>',
);

export async function injectUiChrome(page) {
  await page.addInitScript((svg) => {
    const style = document.createElement("style");
    style.textContent = `
      #rp-tutorial-cursor {
        position: fixed; left: 0; top: 0; width: 32px; height: 32px; z-index: 1000001;
        pointer-events: none; transform: translate(-4px,-4px);
        transition: left 0.42s cubic-bezier(.22,1,.36,1), top 0.42s cubic-bezier(.22,1,.36,1);
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.55));
        background: url("data:image/svg+xml,${svg}") center/contain no-repeat;
      }
      #rp-tutorial-cursor.click { transform: translate(-4px,-4px) scale(0.86); }
      #rp-spotlight {
        position: fixed; z-index: 1000000; pointer-events: none; border-radius: 14px;
        border: 2px solid rgba(168, 85, 247, 0.95);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42), 0 0 40px rgba(124, 58, 237, 0.35);
        transition: all 0.45s cubic-bezier(.22,1,.36,1);
      }
      #rp-step-badge {
        position: fixed; top: 28px; left: 50%; transform: translateX(-50%); z-index: 1000002;
        font: 600 13px/1 system-ui, -apple-system, sans-serif; letter-spacing: 0.12em;
        text-transform: uppercase; color: #f4f1ea; background: rgba(124,58,237,0.92);
        padding: 10px 22px; border-radius: 999px; pointer-events: none;
        box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        opacity: 0; transition: opacity 0.35s ease;
      }
      #rp-step-badge.show { opacity: 1; }
    `;
    document.head.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "rp-tutorial-cursor";
    const spot = document.createElement("div");
    spot.id = "rp-spotlight";
    spot.style.opacity = "0";
    const badge = document.createElement("div");
    badge.id = "rp-step-badge";
    document.addEventListener("DOMContentLoaded", () => {
      document.body.append(badge, spot, cursor);
    });
  }, CURSOR_SVG);
}
