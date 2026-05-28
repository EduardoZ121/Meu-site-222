const CONSENT_KEY = "rp_legal_consent_v1";

export function hasLegalConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function acceptLegalConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "accepted");
  } catch {
    /* ignore */
  }
}
