import { uid, emptyPanel, createNewProject } from "../mangaStudioData";
import { enrichProject } from "../comic/enrichMangaPanel";

const PLACEHOLDER = (label) =>
  `https://placehold.co/400x500/1a1028/9333ea?text=${encodeURIComponent(label)}`;

export function createDemoMangaProject(t) {
  const tr = (k, fallback) => (typeof t === "function" ? t(k) : fallback) || fallback;
  const base = createNewProject(tr("manga_demo_project", "Demo — Rooftop Sunset"));

  const ana = {
    id: uid("char"),
    name: "Ana",
    tag: tr("manga_demo_ana_tag", "Estudante, cabelo castanho, olhos âmbar"),
    description: "Protagonista — jaqueta escolar, fita no cabelo",
    bodyType: "slim",
    consistencyLock: true,
    seedBase: 42891,
    thumb: PLACEHOLDER("Ana"),
    outfitSlots: [
      { id: "casual", name: "Uniforme", category: "casual", isDefault: true, imageUrl: null },
      { id: "battle", name: "Treino", category: "battle", isDefault: false, imageUrl: null },
    ],
    sheets: {
      front: PLACEHOLDER("Ana+F"),
      profile: PLACEHOLDER("Ana+P"),
      threeQuarter: PLACEHOLDER("Ana+3/4"),
      back: PLACEHOLDER("Ana+B"),
      expressions: {
        happy: PLACEHOLDER("Ana+:)"),
        sad: PLACEHOLDER("Ana+:("),
      },
    },
  };

  const rooftop = {
    id: uid("scene"),
    name: tr("manga_demo_scene", "Rooftop Sunset"),
    location: "school rooftop, city skyline",
    description: "Telhado da escola ao entardecer, grades metálicas, céu laranja",
    timeOfDay: "sunset",
    weather: "clear",
    lightingDirection: 250,
    lightingIntensity: 0.78,
    lightingColorTemp: "warm",
    thumb: PLACEHOLDER("Rooftop"),
    variants: { day: null, night: null, interior: null },
  };

  const configs = [
    {
      poseId: "think",
      expression: "normal",
      shot: "medium",
      angle: "three_quarter",
      balloonText: tr("manga_demo_line1", "O pôr do sol daqui é sempre igual…"),
      balloonType: "thought",
      screenDirection: "left-to-right",
      eyeLevel: -5,
    },
    {
      poseId: "surprise",
      expression: "shy",
      shot: "close",
      angle: "front",
      balloonText: tr("manga_demo_line2", "Ana?! Desde quando estás aqui?"),
      balloonType: "shout",
      screenDirection: "right-to-left",
      eyeLevel: 5,
      effects: { speed_lines: true },
    },
    {
      poseId: "talk",
      expression: "happy",
      shot: "medium",
      angle: "profile",
      balloonText: tr("manga_demo_line3", "Só desde que percebi que o céu combina contigo."),
      balloonType: "speech",
      screenDirection: "left-to-right",
    },
    {
      poseId: "sit",
      expression: "determined",
      shot: "wide",
      angle: "front",
      balloonText: "",
      balloonType: "speech",
      effects: { dramatic_shadow: true },
      framing: "dutch",
    },
  ];

  const panels = configs.map((cfg, i) => {
    const p = emptyPanel(i);
    return {
      ...p,
      ...cfg,
      characterId: ana.id,
      scenarioId: rooftop.id,
      inheritSceneLighting: true,
      handPose: i === 1 ? "open" : "holding",
      outfitId: "casual",
      status: "draft",
    };
  });

  return enrichProject({
    ...base,
    name: tr("manga_demo_project", "Demo — Rooftop Sunset"),
    stylePreset: "manga-classic",
    pageLayout: "grid_2x2",
    characters: [ana],
    scenarios: [rooftop],
    panels,
  });
}
