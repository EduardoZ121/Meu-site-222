export const SLIDE_ROLES = [
  { key: "cover", label: "Capa", hint: "Gancho — primeira imagem do post" },
  { key: "content", label: "Conteúdo", hint: "Desenvolve a história" },
  { key: "detail", label: "Detalhe", hint: "Close-up, produto ou momento" },
  { key: "cta", label: "CTA", hint: "Fecho com call-to-action" },
];

export function emptySlide(role = "content", text = "") {
  return { role, text, refPhoto: null };
}

export function slideText(slide) {
  if (typeof slide === "string") return slide;
  return slide?.text || "";
}

export function normalizeSlides(slides) {
  return slides.map((s, i) => {
    if (typeof s === "string") {
      const role = i === 0 ? "cover" : (i === slides.length - 1 && slides.length > 1 ? "cta" : "content");
      return emptySlide(role, s);
    }
    return { ...emptySlide("content"), ...s, text: s.text || "" };
  });
}
