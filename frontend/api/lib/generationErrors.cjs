/**
 * Mensagens legíveis para falhas de geração (Replicate / Grok / políticas de conteúdo).
 * @param {string} raw
 * @param {string} [lang] pt | en | es | fr
 */
function formatGenerationError(raw, lang = "en") {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();

  const isTimeout =
    /timeout|timed out|deadline|took too long|exceeded/i.test(lower);

  const isEmpty =
    /empty output|no output|no image|no urls|null output/i.test(lower);

  const isCapacity =
    /rate limit|too many requests|503|502|overloaded|capacity|busy/i.test(lower);

  const isInvalidInput =
    /e006|input was invalid|invalid input|modelerror.*invalid|different inputs/i.test(lower);

  const isContentPolicy =
    /content policy|nsfw|safety|moderat|blocked|not allowed|prohibited|violat/i.test(lower);

  const copy = {
    pt: {
      timeout:
        "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
      empty:
        "O modelo não devolveu nenhum ficheiro. Os créditos foram devolvidos — tenta outro prompt ou duração.",
      capacity:
        "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
      invalidInput:
        "O Wan recusou este pedido (entrada inválida — E006). Pode ser conteúdo sensual, duração maior que o clip original, ou parâmetros que o modelo não aceita. Créditos devolvidos — tenta prompt mais neutro ou a mesma duração do vídeo de origem.",
      contentPolicy:
        "O modelo bloqueou este pedido por política de conteúdo. Créditos devolvidos — reformula o prompt de forma mais neutra.",
      generic:
        "A geração falhou. Os teus créditos foram devolvidos automaticamente.",
    },
    en: {
      timeout:
        "Generation took too long and was cancelled. Credits refunded — try again with a simpler prompt.",
      empty:
        "The model returned no output file. Credits refunded — try a different prompt or duration.",
      capacity:
        "The AI service is busy. Wait a minute and try again — credits refunded.",
      invalidInput:
        "Wan rejected this request (invalid input — E006). It may be sensitive content, duration longer than the source clip, or unsupported settings. Credits refunded — try a neutral prompt or match the source clip length.",
      contentPolicy:
        "The model blocked this request due to content policy. Credits refunded — rephrase the prompt more neutrally.",
      generic:
        "Generation failed. Your credits were refunded automatically.",
    },
    es: {
      timeout:
        "La generación tardó demasiado y se canceló. Créditos devueltos — prueba con un prompt más simple.",
      empty:
        "El modelo no devolvió ningún archivo. Créditos devueltos.",
      capacity:
        "El servicio de IA está ocupado. Espera un minuto — créditos devueltos.",
      invalidInput:
        "Wan rechazó la solicitud (entrada inválida — E006). Puede ser contenido sensible, duración incompatible o ajustes no soportados. Créditos devueltos.",
      contentPolicy:
        "El modelo bloqueó la solicitud por política de contenido. Créditos devueltos.",
      generic:
        "La generación falló. Tus créditos se devolvieron automáticamente.",
    },
    fr: {
      timeout:
        "La génération a pris trop de temps. Crédits remboursés — réessayez avec un prompt plus simple.",
      empty:
        "Le modèle n'a renvoyé aucun fichier. Crédits remboursés.",
      capacity:
        "Le service IA est saturé. Attendez une minute — crédits remboursés.",
      invalidInput:
        "Wan a refusé la demande (entrée invalide — E006). Contenu sensible, durée ou paramètres incompatibles possibles. Crédits remboursés.",
      contentPolicy:
        "Le modèle a bloqué la demande (politique de contenu). Crédits remboursés.",
      generic:
        "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    },
  };

  const L = copy[lang] || copy.pt;
  if (isTimeout) return L.timeout;
  if (isEmpty) return L.empty;
  if (isCapacity) return L.capacity;
  if (isContentPolicy) return L.contentPolicy;
  if (isInvalidInput) return L.invalidInput;
  if (!msg || /^generation failed\.?$/i.test(msg) || /^failed\.?$/i.test(msg)) return L.generic;
  if (msg.length > 220) return L.generic;
  return `${msg} (${lang === "en" ? "credits refunded" : "créditos devolvidos"})`;
}

module.exports = { formatGenerationError };
