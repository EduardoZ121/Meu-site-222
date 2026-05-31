/**
 * Mensagens legíveis para falhas de geração (Replicate / Grok / políticas de conteúdo).
 * @param {string} raw
 * @param {string} [lang] pt | en | es | fr
 */
function formatGenerationError(raw, lang = "en") {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();

  const isTimeout =
    /timeout|timed out|deadline|took too long|exceeded|tempo esgotado|time.?out/i.test(lower);

  const isEmpty =
    /empty output|no output|no image|no urls|null output|sem resultado|sem ficheiro|no result/i.test(lower);

  const isCapacity =
    /rate limit|too many requests|503|502|overloaded|capacity|busy|ocupado/i.test(lower);

  const isContentBlocked =
    /nsfw|safety|moderation|content.?policy|blocked|refused|explicit|adult|inappropriate|violat/i.test(lower);

  const copy = {
    pt: {
      timeout:
        "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
      empty:
        "O modelo não devolveu nenhuma imagem. Os créditos foram devolvidos — tenta outro prompt ou proporção.",
      capacity:
        "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
      content:
        "O modelo recusou este pedido (política de conteúdo). Os créditos foram devolvidos — tenta um prompt mais neutro.",
      generic:
        "A geração falhou. Os teus créditos foram devolvidos automaticamente.",
    },
    en: {
      timeout:
        "Generation took too long and was cancelled. Credits refunded — try again with a simpler prompt.",
      empty:
        "The model returned no image. Credits refunded — try a different prompt or aspect ratio.",
      capacity:
        "The AI service is busy. Wait a minute and try again — credits refunded.",
      content:
        "The model refused this request (content policy). Credits were refunded — try a neutral prompt.",
      generic:
        "Generation failed. Your credits were refunded automatically.",
    },
    es: {
      timeout:
        "La generación tardó demasiado y se canceló. Créditos devueltos — prueba con un prompt más simple.",
      empty:
        "El modelo no devolvió ninguna imagen. Créditos devueltos.",
      capacity:
        "El servicio de IA está ocupado. Espera un minuto — créditos devueltos.",
      content:
        "El modelo rechazó esta solicitud (política de contenido). Créditos devueltos — prueba un prompt neutro.",
      generic:
        "La generación falló. Tus créditos se devolvieron automáticamente.",
    },
    fr: {
      timeout:
        "La génération a pris trop de temps. Crédits remboursés — réessayez avec un prompt plus simple.",
      empty:
        "Le modèle n'a renvoyé aucune image. Crédits remboursés.",
      capacity:
        "Le service IA est saturé. Attendez une minute — crédits remboursés.",
      content:
        "Le modèle a refusé cette demande (politique de contenu). Crédits remboursés — essayez un prompt neutre.",
      generic:
        "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    },
  };

  const L = copy[lang] || copy.en;
  if (isTimeout) return L.timeout;
  if (isEmpty) return L.empty;
  if (isCapacity) return L.capacity;
  if (isContentBlocked) return L.content;
  if (!msg || /^generation failed\.?$/i.test(msg) || /^failed\.?$/i.test(msg)
    || /^a geração falhou\.?$/i.test(msg) || /^geração falhou\.?$/i.test(msg)) {
    return L.generic;
  }
  if (msg.length > 220) return L.generic;
  return msg;
}

module.exports = { formatGenerationError };
