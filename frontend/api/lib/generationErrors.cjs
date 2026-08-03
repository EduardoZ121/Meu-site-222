/**
 * Mensagens legíveis para falhas de geração (Replicate / Grok / políticas de conteúdo).
 * Nunca expor billing/créditos do provedor (Replicate) ao utilizador.
 *
 * @param {string} raw
 * @param {string} [lang] pt | en | es | fr
 * @param {{ type?: string }} [opts] pending/generation type — marketing_video keeps Seedance/Quick copy
 */
function formatGenerationError(raw, lang = "pt", opts = {}) {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();
  const type = String(opts?.type || "").toLowerCase();
  const isMarketingVideo = type === "marketing_video";

  const isTimeout =
    /timeout|timed out|deadline|took too long|time (limit )?exceeded/i.test(lower);

  const isEmpty =
    /empty output|no output|no image|no urls|null output|no file|sem (imagem|ficheiro|resultado)/i.test(lower);

  const isCapacity =
    /rate limit|too many requests|503|502|overloaded|capacity|busy|cuda.*out of memory|out of memory/i.test(lower);

  const isInvalidInput =
    /e006|input was invalid|invalid input|modelerror.*invalid|different inputs|unsupported.*aspect|invalid.*duration/i.test(lower);

  // Créditos/faturação do PROVEDOR (Replicate etc.) — nunca expor ao utilizador.
  // Não apanhar "Insufficient credits" da carteira Remake (mensagem de utilizador).
  const isUserWallet =
    /cr[eé]ditos (hq )?insuficientes|insufficient (premium )?credits|need(s)? more credits|compra packs|buy credits/i.test(lower);
  const isBilling = !isUserWallet && (
    /insufficient credit.*(replicate|account|balance)?|replicate.*(insufficient|out of credit|billing)|spend(ing)? limit|payment required|add (a )?payment method|past due|quota exceeded|monthly limit|account.*(suspend|disabled|deactivat)|out of credit|ran out of credit|run out of credit|insufficient funds|no credits? (left|remaining) on (your )?replicate/i.test(lower)
  );

  const isSeedanceSensitive =
    /e005|flagged as sensitive|input or output was flagged/i.test(lower);

  const isNsfw =
    /\bnsfw\b|not\s*safe\s*for\s*work|explicit\s*content|adult\s*content|sexual\s*content|pornograph|nude\s*content|\bnudity\b|\berotic\b/i.test(lower);

  const isContentPolicy =
    !isSeedanceSensitive
    && (
      isNsfw
      || /content policy|safety filter|safety checker|moderat|blocked by|prohibited|violat(es|ion)|against (our|the) (policies|guidelines)|output blocked|image was filtered|filtered out|refuse(d|s)? to (generate|create)|can't assist|cannot assist|i'm not able to|unsafe content|sensitive content|política de conteúdo|filtro de segurança/i.test(lower)
    );

  const copy = {
    pt: {
      timeout:
        "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
      empty:
        "O modelo não devolveu nenhuma imagem/vídeo. Muitas vezes é o filtro de segurança ou conteúdo sensível/NSFW. Créditos devolvidos — tenta outro prompt ou foto.",
      capacity:
        "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
      seedanceSensitiveMv:
        "O Seedance bloqueou como «conteúdo sensível» (falso positivo frequente). Tentámos automaticamente prompt neutro e depois Wan I2V. Se falhou tudo, usa modo Rápido com foto de produto. Créditos devolvidos.",
      safetyBlocked:
        "O filtro de segurança da IA bloqueou esta geração (conteúdo sensível). Créditos devolvidos — suaviza o prompt ou tenta outra foto/vídeo.",
      nsfwBlocked:
        "Este pedido foi bloqueado por conteúdo sensível ou adulto (NSFW). Créditos devolvidos — tenta outro prompt, imagem ou motor mais permissivo (ex.: Grok no vídeo).",
      invalidInput:
        "O modelo recusou este pedido (entrada inválida: formato, duração ou parâmetros). Créditos devolvidos — verifica o ficheiro e as definições.",
      invalidInputMv:
        "O modelo recusou este pedido (entrada inválida). Pode ser duração, formato ou parâmetros — não significa necessariamente que a foto seja inadequada. Créditos devolvidos — tenta modo Rápido ou outro template.",
      contentPolicy:
        "O modelo bloqueou este pedido por política de conteúdo / NSFW. Créditos devolvidos — tenta outro prompt ou uma imagem mais neutra.",
      contentPolicyMv:
        "O modelo bloqueou este pedido por política de conteúdo. Créditos devolvidos — tenta modo Rápido ou outra foto mais neutra.",
      maintenance:
        "O serviço de geração está temporariamente indisponível. Os teus créditos foram devolvidos. Tenta novamente mais tarde ou contacta o suporte.",
      generic:
        "A geração falhou. Os teus créditos foram devolvidos automaticamente. Se for conteúdo adulto, tenta outro prompt ou motor.",
    },
    en: {
      timeout:
        "Generation took too long and was cancelled. Credits refunded — try again with a simpler prompt.",
      empty:
        "The model returned no image/video. This is often a safety filter or sensitive/NSFW block. Credits refunded — try a different prompt or photo.",
      capacity:
        "The AI service is busy. Wait a minute and try again — credits refunded.",
      seedanceSensitiveMv:
        "Seedance flagged this as sensitive content — often a false positive. Credits refunded. Try Quick mode, the Product Power template, or a more neutral photo.",
      safetyBlocked:
        "The AI safety filter blocked this generation (sensitive content). Credits refunded — soften the prompt or try another photo/video.",
      nsfwBlocked:
        "This request was blocked for sensitive or adult content (NSFW). Credits refunded — try another prompt, image, or a more permissive engine (e.g. Grok for video).",
      invalidInput:
        "The model rejected this request (invalid input: format, duration, or settings). Credits refunded — check the file and options.",
      invalidInputMv:
        "The model rejected this request (invalid input). It may be duration, format, or unsupported settings — not necessarily your photo. Credits refunded — try Quick mode or another template.",
      contentPolicy:
        "The model blocked this request due to content policy / NSFW. Credits refunded — try another prompt or a more neutral image.",
      contentPolicyMv:
        "The model blocked this request due to content policy. Credits refunded — try Quick mode or a more neutral photo.",
      maintenance:
        "The generation service is temporarily unavailable. Your credits were refunded. Please try again later or contact support.",
      generic:
        "Generation failed. Your credits were refunded automatically. For adult content, try another prompt or engine.",
    },
    es: {
      timeout:
        "La generación tardó demasiado y se canceló. Créditos devueltos — prueba con un prompt más simple.",
      empty:
        "El modelo no devolvió ninguna imagen/vídeo. A menudo es el filtro de seguridad o contenido sensible/NSFW. Créditos devueltos.",
      capacity:
        "El servicio de IA está ocupado. Espera un minuto — créditos devueltos.",
      seedanceSensitiveMv:
        "Seedance marcó esto como contenido sensible — a menudo es un falso positivo. Créditos devueltos — prueba modo Rápido u otra foto neutra.",
      safetyBlocked:
        "El filtro de seguridad bloqueó esta generación (contenido sensible). Créditos devueltos.",
      nsfwBlocked:
        "Esta solicitud fue bloqueada por contenido sensible o adulto (NSFW). Créditos devueltos.",
      invalidInput:
        "El modelo rechazó la solicitud (entrada inválida). Créditos devueltos — revisa el archivo y los ajustes.",
      invalidInputMv:
        "El modelo rechazó la solicitud (entrada inválida). Créditos devueltos — prueba otro modo o plantilla.",
      contentPolicy:
        "El modelo bloqueó la solicitud por política de contenido / NSFW. Créditos devueltos.",
      contentPolicyMv:
        "El modelo bloqueó la solicitud por política de contenido. Créditos devueltos — prueba modo Rápido.",
      maintenance:
        "El servicio de generación no está disponible temporalmente. Tus créditos fueron devueltos. Inténtalo más tarde o contacta con soporte.",
      generic:
        "La generación falló. Tus créditos se devolvieron automáticamente.",
    },
    fr: {
      timeout:
        "La génération a pris trop de temps. Crédits remboursés — réessayez avec un prompt plus simple.",
      empty:
        "Le modèle n'a renvoyé aucune image/vidéo. Souvent un filtre de sécurité ou un blocage NSFW. Crédits remboursés.",
      capacity:
        "Le service IA est saturé. Attendez une minute — crédits remboursés.",
      seedanceSensitiveMv:
        "Seedance a signalé un contenu sensible — souvent un faux positif. Crédits remboursés — essayez le mode Rapide ou une photo neutre.",
      safetyBlocked:
        "Le filtre de sécurité a bloqué cette génération (contenu sensible). Crédits remboursés.",
      nsfwBlocked:
        "Cette demande a été bloquée pour contenu sensible ou adulte (NSFW). Crédits remboursés.",
      invalidInput:
        "Le modèle a refusé la demande (entrée invalide). Crédits remboursés — vérifiez le fichier et les réglages.",
      invalidInputMv:
        "Le modèle a refusé la demande (entrée invalide). Crédits remboursés.",
      contentPolicy:
        "Le modèle a bloqué la demande (politique de contenu / NSFW). Crédits remboursés.",
      contentPolicyMv:
        "Le modèle a bloqué la demande (politique de contenu). Crédits remboursés — essayez le mode Rapide.",
      maintenance:
        "Le service de génération est temporairement indisponible. Vos crédits ont été remboursés. Réessayez plus tard ou contactez le support.",
      generic:
        "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    },
  };

  const L = copy[lang] || copy.pt;

  if (isUserWallet) return msg;
  if (isBilling) return L.maintenance;
  if (isTimeout) return L.timeout;
  if (isEmpty) return L.empty;
  if (isCapacity) return L.capacity;
  if (isSeedanceSensitive) {
    return isMarketingVideo ? L.seedanceSensitiveMv : L.safetyBlocked;
  }
  if (isNsfw) return L.nsfwBlocked;
  if (isContentPolicy) {
    return isMarketingVideo ? L.contentPolicyMv : L.contentPolicy;
  }
  if (isInvalidInput) {
    return isMarketingVideo ? L.invalidInputMv : L.invalidInput;
  }
  return L.generic;
}

module.exports = { formatGenerationError };
