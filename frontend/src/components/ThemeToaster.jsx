import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getTheme } from "../lib/theme";

const DARK_STYLE = {
  background: "#121217",
  color: "#F4F1EA",
  border: "1px solid rgba(244,241,234,0.08)",
};

const LIGHT_STYLE = {
  background: "#ffffff",
  color: "#18181b",
  border: "1px solid rgba(24,24,27,0.1)",
};

/** Sonner toaster that follows data-theme (dark default). */
export default function ThemeToaster() {
  const [theme, setTheme] = useState(() => getTheme());

  useEffect(() => {
    const sync = () => setTheme(getTheme());
    sync();
    window.addEventListener("rp:theme-change", sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.removeEventListener("rp:theme-change", sync);
      obs.disconnect();
    };
  }, []);

  const isLight = theme === "light";
  return (
    <Toaster
      position="top-center"
      theme={isLight ? "light" : "dark"}
      toastOptions={{ style: isLight ? LIGHT_STYLE : DARK_STYLE }}
    />
  );
}
