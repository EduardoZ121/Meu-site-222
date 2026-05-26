import { useMemo } from "react";
import { useI18n } from "./i18n";
import TOOLS from "./toolsCatalogue";

/** Tools catalogue with names/descriptions from the active locale. */
export function useLocalizedTools() {
  const { t } = useI18n();
  return useMemo(
    () =>
      TOOLS.map((tool) => ({
        ...tool,
        name: t(`tool_${tool.id}_name`),
        desc: t(`tool_${tool.id}_desc`),
      })),
    [t],
  );
}
