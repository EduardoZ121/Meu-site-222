import { Plus } from "lucide-react";
import { useFlowStore } from "./useFlowStore";

export default function SceneTabs() {
  const scenes = useFlowStore((s) => s.scenes);
  const activeSceneId = useFlowStore((s) => s.activeSceneId);
  const setActiveScene = useFlowStore((s) => s.setActiveScene);
  const addScene = useFlowStore((s) => s.addScene);

  return (
    <div className="as-scene-tabs" data-testid="anime-scene-tabs">
      {scenes.map((sc) => (
        <button
          key={sc.id}
          type="button"
          className={`as-scene-tab ${activeSceneId === sc.id ? "as-scene-tab--on" : ""}`}
          onClick={() => setActiveScene(sc.id)}
        >
          {sc.name}
          <span className="as-scene-count">{(sc.nodes || []).length}</span>
        </button>
      ))}
      <button
        type="button"
        className="as-scene-tab as-scene-tab--add"
        onClick={() => {
          const name = window.prompt("Nome da cena", "Nova cena");
          if (name) addScene(name);
        }}
        title="Nova cena"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
