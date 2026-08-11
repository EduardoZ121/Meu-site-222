import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MATCH = "match";

function photoFingerprint(photos) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : photos ? [photos] : [];
  if (!list.length) return "";
  return list.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
}

/**
 * Proporção de saída: sugere "match" quando há foto; não sobrescreve se o utilizador
 * escolheu outro formato depois de carregar a foto.
 */
export function usePhotoAspectDefault(
  photos,
  fallbackWhenNoPhoto = "4:5",
  initialAspect,
) {
  const safeFallback =
    fallbackWhenNoPhoto === MATCH ? "4:5" : fallbackWhenNoPhoto;
  const initial = initialAspect === MATCH ? safeFallback : (initialAspect || safeFallback);
  const [aspect, setAspectState] = useState(initial);
  const userLockedRef = useRef(false);
  const prevFingerprintRef = useRef("");

  const fingerprint = useMemo(() => photoFingerprint(photos), [photos]);

  useEffect(() => {
    if (fingerprint) {
      if (fingerprint !== prevFingerprintRef.current) {
        prevFingerprintRef.current = fingerprint;
        userLockedRef.current = false;
        setAspectState(MATCH);
        return;
      }
      if (!userLockedRef.current) {
        setAspectState(MATCH);
      }
    } else {
      prevFingerprintRef.current = "";
      userLockedRef.current = false;
      setAspectState((prev) => (prev === MATCH ? safeFallback : prev));
    }
  }, [fingerprint, safeFallback]);

  const setAspect = useCallback((next) => {
    if (next && next !== MATCH) userLockedRef.current = true;
    setAspectState(next);
  }, []);

  return [aspect, setAspect];
}

export const ASPECT_MATCH = MATCH;
