/** Configuração partilhada para submeter geração sem bloquear no poll síncrono. */

export const SKIP_AUTO_POLL_HEADER = "X-Skip-Auto-Poll";

export function generationSubmitConfig(opts = {}) {
  const { background = true, headers = {}, ...rest } = opts;
  return {
    ...rest,
    backgroundPoll: background,
    headers: {
      [SKIP_AUTO_POLL_HEADER]: "1",
      ...headers,
    },
  };
}
