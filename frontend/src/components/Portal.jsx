import { createPortal } from "react-dom";

/** Render children on document.body (escapes dashboard overflow stacking). */
export default function Portal({ children }) {
  if (typeof document === "undefined") return children;
  return createPortal(children, document.body);
}
