import { api } from "./api";
import {
  buildMangaChapterPrompt,
  buildMangaPagePrompt,
  buildMangaPanelPrompt,
} from "./buildMangaPrompt";
import { panelForApi, projectMetaForApi } from "./mangaFormPayload";

export function buildLocalMangaPrompt({
  mode,
  panel,
  panels,
  project,
  character,
  scenario,
}) {
  const meta = {
    characters: project?.characters,
    scenarios: project?.scenarios,
    pageLayout: project?.pageLayout,
  };
  if (mode === "page") {
    return buildMangaPagePrompt(panels || [], meta);
  }
  if (mode === "chapter") {
    return buildMangaChapterPrompt(
      [{ panels: panels || project?.panels, layout: project?.pageLayout }],
      meta,
    );
  }
  return buildMangaPanelPrompt({
    panel,
    character,
    scenario,
    pageLayout: project?.pageLayout,
  });
}

/**
 * Prompt local imediato + GPT opcional (timeout curto).
 */
export async function composeMangaPromptApi({
  mode,
  panel,
  panels,
  project,
  character,
  scenario,
  lang = "en",
  useGpt = true,
  timeoutMs = 14_000,
}) {
  const fallback = buildLocalMangaPrompt({
    mode,
    panel,
    panels,
    project,
    character,
    scenario,
  });

  if (!useGpt) return { prompt: fallback, source: "local" };

  try {
    const call = api.post(
      "/prompt/manga-compose",
      {
        mode,
        panel: panelForApi(panel),
        panels: (panels || []).map(panelForApi),
        project: projectMetaForApi(project),
        character: stripCharacter(character),
        scenario: stripCharacter(scenario),
        lang,
        fallback_prompt: fallback.slice(0, 2000),
      },
      { timeout: timeoutMs },
    );
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("GPT timeout")), timeoutMs + 500);
    });
    const { data } = await Promise.race([call, timeout]);
    if (data?.prompt?.length >= 20) return { prompt: data.prompt, source: "gpt" };
  } catch {
    /* fallback local */
  }
  return { prompt: fallback, source: "local" };
}

function stripCharacter(c) {
  if (!c) return null;
  const { thumb, sheets, ...rest } = c;
  return {
    ...rest,
    hasThumb: Boolean(thumb || sheets?.front),
  };
}
