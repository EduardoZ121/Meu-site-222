import { useEffect, useRef, useState } from "react";
import { setPreviewFromFile, revokePreviewUrl } from "../lib/studioUpload/mediaPreview";

/**
 * Preview object-URL estável para qualquer File (estúdio + ferramentas).
 */
export function useStudioMediaPreview(file) {
  const storeRef = useRef({ current: null, key: "" });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    const url = setPreviewFromFile(file || null, storeRef.current);
    setPreviewUrl(url);
  }, [file]);

  useEffect(() => () => {
    const store = storeRef.current;
    if (store) {
      revokePreviewUrl(store.current);
      store.current = null;
      store.key = "";
    }
  }, []);

  return {
    previewUrl,
    previewBroken: broken,
    markPreviewBroken: () => setBroken(true),
  };
}
