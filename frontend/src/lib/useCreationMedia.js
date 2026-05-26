import { useEffect, useState } from "react";
import { api } from "./api";
import { isVideoCreation, primaryResultUrl } from "./creationUrls";

/**
 * Carrega thumbnail via API autenticada (Bearer) — img não envia token sozinho.
 */
export function useCreationMedia(creation) {
  const id = creation?.id;
  const directUrl = primaryResultUrl(creation);
  const isVideo = isVideoCreation(creation, directUrl);
  const [src, setSrc] = useState(null);
  const [broken, setBroken] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setSrc(null);
      setBroken(!directUrl);
      setLoading(false);
      return undefined;
    }

    let objectUrl = null;
    let cancelled = false;
    setLoading(true);
    setBroken(false);

    api
      .get(`/generations/${encodeURIComponent(id)}/media`, {
        responseType: "blob",
        timeout: 60000,
      })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data;
        if (!blob || blob.size < 32) {
          setBroken(true);
          setSrc(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setBroken(false);
      })
      .catch(() => {
        if (!cancelled) {
          setBroken(true);
          setSrc(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, directUrl]);

  return { src, broken, loading, isVideo, directUrl };
}
