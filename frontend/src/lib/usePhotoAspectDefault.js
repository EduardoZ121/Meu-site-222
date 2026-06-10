import { useCallback, useEffect, useRef, useState } from "react";

const MATCH = "match";

/**
 * Proporção de saída: sugere "match" na primeira foto; não sobrescreve se o utilizador
 * escolheu outro formato depois.
 *
 * @param {File|null|undefined} photo
 * @param {string} [fallbackWhenNoPhoto="4:5"]
 * @param {string} [initialAspect] — estado inicial sem foto (evitar "match" se não houver opção na UI)
 */
export function usePhotoAspectDefault(
  photo,
  fallbackWhenNoPhoto = "4:5",
  initialAspect,
) {
  const safeFallback =
    fallbackWhenNoPhoto === MATCH ? "4:5" : fallbackWhenNoPhoto;
  const initial = initialAspect === MATCH ? safeFallback : (initialAspect || safeFallback);
  const [aspect, setAspectState] = useState(initial);
  const userLockedRef = useRef(false);
  const hadPhotoRef = useRef(false);

  useEffect(() => {
    if (photo) {
      if (!hadPhotoRef.current && !userLockedRef.current) {
        setAspectState(MATCH);
      }
      hadPhotoRef.current = true;
    } else {
      hadPhotoRef.current = false;
      userLockedRef.current = false;
      setAspectState((prev) => (prev === MATCH ? safeFallback : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  const setAspect = useCallback((next) => {
    if (next && next !== MATCH) userLockedRef.current = true;
    setAspectState(next);
  }, []);

  return [aspect, setAspect];
}

export const ASPECT_MATCH = MATCH;
