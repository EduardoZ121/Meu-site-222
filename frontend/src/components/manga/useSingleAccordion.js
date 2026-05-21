import { useCallback, useState } from "react";

/** Mobile: só uma secção do accordion aberta de cada vez. */
export function useSingleAccordion(defaultId = "character") {
  const [openId, setOpenId] = useState(defaultId);
  const isOpen = useCallback((id) => openId === id, [openId]);
  const toggle = useCallback((id) => {
    setOpenId((prev) => (prev === id ? "" : id));
  }, []);
  return { openId, isOpen, toggle, setOpenId };
}
