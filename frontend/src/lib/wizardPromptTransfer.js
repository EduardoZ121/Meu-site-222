/** Evita URLs gigantes ao enviar prompt do Wizard para o Estúdio. */
export const WIZARD_PROMPT_STORAGE_KEY = "rp_wizard_prompt";

export function stashWizardPrompt(prompt) {
  if (!prompt || typeof prompt !== "string") return;
  try {
    sessionStorage.setItem(WIZARD_PROMPT_STORAGE_KEY, prompt);
  } catch {
    /* ignore quota */
  }
}

export function consumeWizardPrompt() {
  try {
    const value = sessionStorage.getItem(WIZARD_PROMPT_STORAGE_KEY);
    if (value) sessionStorage.removeItem(WIZARD_PROMPT_STORAGE_KEY);
    return value || "";
  } catch {
    return "";
  }
}

export function peekWizardPrompt() {
  try {
    return sessionStorage.getItem(WIZARD_PROMPT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}
