import { useEffect } from "react";

const SCRIPT_ID = "rp-seo-jsonld";

/**
 * Injects JSON-LD structured data for Google rich results.
 * @param {object|object[]} data — one schema object or array of objects
 */
export default function SeoJsonLd({ data }) {
  const serialized = JSON.stringify(Array.isArray(data) ? data : [data]);

  useEffect(() => {
    const list = JSON.parse(serialized);
    const payload = list.length === 1 ? list[0] : list;

    let el = document.getElementById(SCRIPT_ID);
    if (!el) {
      el = document.createElement("script");
      el.id = SCRIPT_ID;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);

    return () => {
      const node = document.getElementById(SCRIPT_ID);
      if (node) node.remove();
    };
  }, [serialized]);

  return null;
}
