/**
 * Mensagens legíveis para falhas de geração (Replicate / Grok / políticas de conteúdo).
 * @param {string} raw
 * @param {string} [lang] pt | en | es | fr
 */
function formatGenerationError(raw, lang = "en") {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();

  const isNsfw =
    /nsfw|nude|nudity|sexual|explicit|adult content|porn|erotic|hentai|inappropriate|not allowed|content policy|safety filter|moderation|blocked|violat|restricted|cannot generate|refus/i.test(
      lower,
    );

  const isTimeout =
    /timeout|timed out|deadline|took too long|exceeded/i.test(lower);

  const isEmpty =
    /empty output|no output|no image|no urls|null output/i.test(lower);

  const isCapacity =
    /rate limit|too many requests|503|502|overloaded|capacity|busy/i.test(lower);

  const copy = {
    pt: {
      nsfw:
        "Este pedido não é permitido pelas regras do modelo (conteúdo adulto ou explícito). Reformula de forma neutra ou escolhe outro estilo — os créditos foram devolvidos.",
      timeout:
        "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
      empty:
        "O modelo não devolveu nenhuma imagem. Os créditos foram devolvidos — tenta outro prompt ou proporção.",
      capacity:
        "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
      generic:
        "A geração falhou. Os teus créditos foram devolvidos automaticamente.",
    },
    en: {
      nsfw:
        "This request isn't allowed by the model's content rules (adult or explicit content). Rephrase neutrally or try another tool — your credits were refunded.",
      timeout:
        "Generation took too long and was cancelled. Credits refunded — try again with a simpler prompt.",
      empty:
        "The model returned no image. Credits refunded — try a different prompt or aspect ratio.",
      capacity:
        "The AI service is busy. Wait a minute and try again — credits refunded.",
      generic:
        "Generation failed. Your credits were refunded automatically.",
    },
    es: {
      nsfw:
        "Esta solicitud no está permitida por las reglas del modelo (contenido adulto o explícito). Reformula de forma neutra — créditos devueltos.",
      timeout:
        "La generación tardó demasiado y se canceló. Créditos devueltos — prueba con un prompt más simple.",
      empty:
        "El modelo no devolvió ninguna imagen. Créditos devueltos.",
      capacity:
        "El servicio de IA está ocupado. Espera un minuto — créditos devueltos.",
      generic:
        "La generación falló. Tus créditos se devolvieron automáticamente.",
    },
    fr: {
      nsfw:
        "Cette demande n'est pas autorisée par les règles du modèle (contenu adulte ou explicite). Reformulez — crédits remboursés.",
      timeout:
        "La génération a pris trop de temps. Crédits remboursés — réessayez avec un prompt plus simple.",
      empty:
        "Le modèle n'a renvoyé aucune image. Crédits remboursés.",
      capacity:
        "Le service IA est saturé. Attendez une minute — crédits remboursés.",
      generic:
        "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    },
  };

  const L = copy[lang] || copy.pt;
  if (isNsfw) return L.nsfw;
  if (isTimeout) return L.timeout;
  if (isEmpty) return L.empty;
  if (isCapacity) return L.capacity;
  if (!msg || /^generation failed\.?$/i.test(msg) || /^failed\.?$/i.test(msg)) return L.generic;
  if (msg.length > 220) return L.generic;
  return `${msg} (${lang === "en" ? "credits refunded" : "créditos devolvidos"})`;
}

module.exports = { formatGenerationError };
