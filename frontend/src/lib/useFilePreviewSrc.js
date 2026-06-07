import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeImageFile } from "./imageCompress";
import { isAndroid, isIOS } from "./device";
import { readFileAsDataURL, revokeFilePreviewUrl } from "./previewDataUrl";

const DATA_URL_FIRST_MAX_BYTES = 10 * 1024 * 1024;

function fileStableKey(file) {
  if (!file) return "";
  return `${file.name || ""}|${file.size}|${file.lastModified}|${file.type || ""}`;
}

/**
 * URL estável para <img>/<video> — object URL sem revoke prematuro;
 * em falha (comum em Android) tenta data URL automaticamente.
 */
export function useFilePreviewSrc(file, { isVideo = false } = {}) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  const [fallbackBusy, setFallbackBusy] = useState(false);
  const blobRef = useRef(null);
  const genRef = useRef(0);

  const releaseBlob = useCallback(() => {
    revokeFilePreviewUrl(blobRef.current);
    blobRef.current = null;
  }, []);

  useEffect(() => {
    const key = fileStableKey(file);
    if (!file || !key) {
      genRef.current += 1;
      releaseBlob();
      setSrc(null);
      setFailed(false);
      setFallbackBusy(false);
      return undefined;
    }

    const gen = genRef.current + 1;
    genRef.current = gen;
    let cancelled = false;

    releaseBlob();
    setFailed(false);
    setFallbackBusy(false);

    const work = isVideo ? file : normalizeImageFile(file);

    const applyDataUrl = async () => {
      try {
        const dataUrl = await readFileAsDataURL(work);
        if (cancelled || gen !== genRef.current) return;
        releaseBlob();
        setSrc(dataUrl);
        setFailed(false);
      } catch {
        if (!cancelled && gen === genRef.current) setFailed(true);
      } finally {
        if (!cancelled && gen === genRef.current) setFallbackBusy(false);
      }
    };

    const preferDataUrl = !isVideo
      && (isAndroid() || isIOS())
      && work.size <= DATA_URL_FIRST_MAX_BYTES;

    if (preferDataUrl) {
      setFallbackBusy(true);
      void applyDataUrl();
      return () => { cancelled = true; };
    }

    const blobUrl = URL.createObjectURL(work);
    blobRef.current = blobUrl;
    setSrc(blobUrl);

    return () => {
      cancelled = true;
    };
  }, [file, isVideo, releaseBlob]);

  useEffect(() => () => {
    releaseBlob();
  }, [releaseBlob]);

  const retryWithDataUrl = useCallback(async () => {
    if (!file || isVideo) return false;
    const gen = genRef.current;
    setFallbackBusy(true);
    try {
      const dataUrl = await readFileAsDataURL(normalizeImageFile(file));
      if (gen !== genRef.current) return false;
      releaseBlob();
      setSrc(dataUrl);
      setFailed(false);
      return true;
    } catch {
      if (gen === genRef.current) setFailed(true);
      return false;
    } finally {
      if (gen === genRef.current) setFallbackBusy(false);
    }
  }, [file, isVideo, releaseBlob]);

  const onPreviewError = useCallback(() => {
    void retryWithDataUrl();
  }, [retryWithDataUrl]);

  const clear = useCallback(() => {
    genRef.current += 1;
    releaseBlob();
    setSrc(null);
    setFailed(false);
    setFallbackBusy(false);
  }, [releaseBlob]);

  return {
    previewSrc: src,
    previewFailed: failed,
    previewFallbackBusy: fallbackBusy,
    onPreviewError,
    clearPreview: clear,
  };
}
