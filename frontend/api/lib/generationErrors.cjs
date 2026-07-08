/**
 * Mensagens legíveis para falhas de geração (Replicate / Grok / políticas de conteúdo).
 * @param {string} raw
 * @param {string} [lang] pt | en | es | fr
 */
function formatGenerationError(raw, lang = "pt") {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();

  const isTimeout =
    /timeout|timed out|deadline|took too long|time (limit )?exceeded/i.test(lower);

  const isEmpty =
    /empty output|no output|no image|no urls|null output/i.test(lower);

  const isCapacity =
    /rate limit|too many requests|503|502|overloaded|capacity|busy/i.test(lower);

  const isInvalidInput =
    /e006|input was invalid|invalid input|modelerror.*invalid|different inputs/i.test(lower);

  // Faturação/créditos do provedor esgotados (nunca expor ao utilizador).
  const isBilling =
    /insufficient credit|insufficient funds|out of credit|ran out of credit|run out of credit|no credit|spend(ing)? limit|payment required|payment method|past due|billing|quota exceeded|\b402\b|monthly limit|account.*(suspend|disabled|deactivat)|add (a )?payment/i.test(lower);

  const isSeedanceSensitive =
    /e005|flagged as sensitive|input or output was flagged/i.test(lower);

  const isContentPolicy =
    /content policy|nsfw|safety filter|moderat|blocked|not allowed|prohibited|violat/i.test(lower)
    && !isSeedanceSensitive;

  const copy = {
    pt: {
      timeout:
        "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
      empty:
        "O modelo não devolveu nenhum ficheiro. Os créditos foram devolvidos — tenta outro prompt ou duração.",
      capacity:
        "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
      seedanceSensitive:
        "O Seedance bloqueou como «conteúdo sensível» (falso positivo frequente). Tentámos automaticamente prompt neutro e depois Wan I2V. Se falhou tudo, usa modo Rápido com foto de produto. Créditos devolvidos.",
      invalidInput:
        "O modelo recusou este pedido (entrada inválida). Pode ser duração, formato ou parâmetros incompatíveis — não significa necessariamente que a tua foto seja inadequada. Créditos devolvidos — tenta modo Rápido ou outro template.",
      contentPolicy:
        "O modelo bloqueou este pedido por política de conteúdo. Créditos devolvidos — tenta modo Rápido ou outra foto mais neutra.",
      maintenance:
        "O serviço de geração está temporariamente indisponível para manutenção. Os teus créditos foram devolvidos. Tenta novamente mais tarde ou contacta o suporte.",
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
      seedanceSensitive:
        "Seedance flagged this as sensitive content — often a false positive with normal photos or cinematic scenes. Credits refunded. Try Quick mode, the Product Power template, or a more neutral photo (casual clothes, plain background).",
      invalidInput:
        "The model rejected this request (invalid input). It may be duration, format, or unsupported settings — not necessarily your photo. Credits refunded — try Quick mode or another template.",
      contentPolicy:
        "The model blocked this request due to content policy. Credits refunded — try Quick mode or a more neutral photo.",
      maintenance:
        "The generation service is temporarily unavailable for maintenance. Your credits were refunded. Please try again later or contact support.",
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
      seedanceSensitive:
        "Seedance marcó esto como contenido sensible — a menudo es un falso positivo. Créditos devueltos — prueba modo Rápido u otra foto neutra.",
      invalidInput:
        "El modelo rechazó la solicitud (entrada inválida). Créditos devueltos — prueba otro modo o plantilla.",
      contentPolicy:
        "El modelo bloqueó la solicitud por política de contenido. Créditos devueltos.",
      maintenance:
        "El servicio de generación no está disponible temporalmente por mantenimiento. Tus créditos fueron devueltos. Inténtalo más tarde o contacta con soporte.",
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
      seedanceSensitive:
        "Seedance a signalé un contenu sensible — souvent un faux positif. Crédits remboursés — essayez le mode Rapide ou une photo neutre.",
      invalidInput:
        "Le modèle a refusé la demande (entrée invalide). Crédits remboursés.",
      contentPolicy:
        "Le modèle a bloqué la demande (politique de contenu). Crédits remboursés.",
      maintenance:
        "Le service de génération est temporairement indisponible pour maintenance. Vos crédits ont été remboursés. Réessayez plus tard ou contactez le support.",
      generic:
        "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    },
  };

  const L = copy[lang] || copy.pt;
  // Faturação/créditos do provedor: mensagem de manutenção (nunca expor detalhes internos).
  if (isBilling) return L.maintenance;
  if (isTimeout) return L.timeout;
  if (isEmpty) return L.empty;
  if (isCapacity) return L.capacity;
  if (isSeedanceSensitive) return L.seedanceSensitive;
  if (isContentPolicy) return L.contentPolicy;
  if (isInvalidInput) return L.invalidInput;
  // Qualquer outro erro (não reconhecido) -> mensagem genérica limpa.
  // Nunca devolver o texto cru do provedor ao utilizador.
  return L.generic;
}

module.exports = { formatGenerationError };
