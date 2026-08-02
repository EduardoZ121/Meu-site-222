import { useEffect } from "react";

export default function useTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · Remake` : "Remake";
    return () => { document.title = prev; };
  }, [title]);
}
