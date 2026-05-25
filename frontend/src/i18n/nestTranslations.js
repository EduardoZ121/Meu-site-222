/** Turns flat locale keys into nested groups + keeps flat keys for backward compatibility. */

function setPath(obj, parts, value) {
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function classifyKey(key) {
  if (key === "back_to_tools" || key === "header_credits" || key.startsWith("header_")) {
    return ["header", key.replace(/^header_/, "") || key];
  }
  if (key.startsWith("sidebar_")) {
    const rest = key.slice("sidebar_".length);
    return ["sidebar", rest === "admin_section" ? "admin" : rest];
  }
  if (key.startsWith("tools_page_") || key.startsWith("tools_tab_") || key.startsWith("tool_")) {
    const k = key.replace(/^tools_page_/, "").replace(/^tool_/, "");
    return ["tools_grid", key.startsWith("tools_") ? key.replace("tools_", "") : key];
  }
  if (key === "clothes_desc") return ["clothes_changer", "description"];
  if (key.startsWith("clothes_")) return ["clothes_changer", key.slice("clothes_".length)];
  if (key.startsWith("studio_") || key.startsWith("art_")) {
    return ["studio", key];
  }
  if (key.startsWith("wiz_") || key.startsWith("studio_acc_")) {
    return ["wizard", key];
  }
  if (key.startsWith("post_")) return ["posters", key.slice("post_".length)];
  if (key.startsWith("set_")) return ["settings", key.slice("set_".length)];
  if (key.startsWith("login_")) return ["login", key.slice("login_".length)];
  if (key.startsWith("common_")) return ["common", key.slice("common_".length)];
  if (key.startsWith("bg_") || key.startsWith("upscale_") || key.startsWith("restore_") || key.startsWith("colorize_")) {
    return ["tools_pages", key];
  }
  if (key.startsWith("vid_")) return ["video", key.slice("vid_".length)];
  if (key.startsWith("car_")) return ["carousel", key.slice("car_".length)];
  if (key.startsWith("gal_")) return ["gallery", key.slice("gal_".length)];
  if (key.startsWith("nav_") || key.startsWith("hero_") || key.startsWith("pricing_") || key.startsWith("faq_") || key.startsWith("footer_")) {
    return ["landing", key];
  }
  if (key.startsWith("discover_") || key.startsWith("showcase_") || key.startsWith("home_")) {
    return ["discover", key];
  }
  return null;
}

/** @param {Record<string, string>} flat */
export function nestTranslations(flat) {
  const nested = {
    header: {},
    sidebar: {},
    tools_grid: {},
    clothes_changer: {},
    studio: {},
    wizard: {},
    posters: {},
    settings: {},
    common: {},
    tools_pages: {},
    video: {},
    carousel: {},
    gallery: {},
    login: {},
    landing: {},
  };

  const out = { ...flat };

  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== "string") continue;
    const path = classifyKey(key);
    if (path) setPath(nested, path, value);
    out[key] = value;
  }

  return { ...nested, ...out };
}
