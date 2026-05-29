import { useEffect, useState } from "react";

const MATCH = "match";

/**
 * Proporção de saída: "match" (original da foto) enquanto houver foto;
 * volta ao fallback quando a foto é removida.
 *
 * @param {File|null|undefined} photo
 * @param {string} [fallbackWhenNoPhoto="4:5"]
 * @param {string} [initialAspect] — estado inicial sem foto (ex. definições do utilizador)
 */
export function usePhotoAspectDefault(
  photo,
  fallbackWhenNoPhoto = "4:5",
  initialAspect,
) {
  const safeFallback =
    fallbackWhenNoPhoto === MATCH ? "4:5" : fallbackWhenNoPhoto;
  const initial = initialAspect === MATCH ? MATCH : (initialAspect || safeFallback);
  const [aspect, setAspect] = useState(initial);

  useEffect(() => {
    if (photo) {
      setAspect(MATCH);
    } else if (aspect === MATCH) {
      setAspect(safeFallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  return [aspect, setAspect];
}

export const ASPECT_MATCH = MATCH;
