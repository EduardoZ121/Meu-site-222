import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rp:pinned-tools";

function readPinned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function usePinnedTools() {
  const [pinnedIds, setPinnedIds] = useState(readPinned);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds));
    } catch {
      /* ignore quota */
    }
  }, [pinnedIds]);

  const isPinned = useCallback((id) => pinnedIds.includes(id), [pinnedIds]);

  const togglePin = useCallback((id) => {
    setPinnedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  }, []);

  return { pinnedIds, isPinned, togglePin };
}
