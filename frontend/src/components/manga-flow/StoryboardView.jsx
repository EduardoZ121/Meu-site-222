import { User, MapPin, Box, MessageCircle, Sparkles, Camera, Square } from "lucide-react";

const ICONS = { person: User, scenario: MapPin, object: Box, speech: MessageCircle, effect: Sparkles, camera: Camera, panel: Square };
const COLORS = { person: "#C4B5FD", scenario: "#5EEAD4", object: "#FDE68A", speech: "#93C5FD", effect: "#FDBA74", camera: "#F9A8D4", panel: "#D4D4D4" };

export default function StoryboardView({ nodes, edges, onSelectNode }) {
  const sorted = [...nodes].sort((a, b) => {
    const typeOrder = { panel: 0, scenario: 1, camera: 2, person: 3, object: 4, speech: 5, effect: 6 };
    return (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9);
  });

  return (
    <div className="mf-storyboard" data-testid="storyboard-view">
      <p className="mf-storyboard__title">Storyboard / Timeline</p>
      <div className="mf-storyboard__list">
        {sorted.map((node, i) => {
          const Icon = ICONS[node.type] || Box;
          const color = COLORS[node.type] || "#999";
          const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
          return (
            <div key={node.id} className="mf-storyboard__item" onClick={() => onSelectNode(node.id)}>
              <div className="mf-storyboard__num">{i + 1}</div>
              <div className="mf-storyboard__icon" style={{ color }}><Icon className="w-4 h-4" /></div>
              <div className="mf-storyboard__info">
                <p className="mf-storyboard__name">{node.data?.name || node.data?.text || node.type}</p>
                <p className="mf-storyboard__meta">{node.type} · {nodeEdges.length} link{nodeEdges.length !== 1 ? "s" : ""}</p>
              </div>
              {nodeEdges.length > 0 && (
                <div className="mf-storyboard__links">
                  {nodeEdges.slice(0, 2).map(e => {
                    const other = nodes.find(n => n.id === (e.source === node.id ? e.target : e.source));
                    return <span key={e.id} className="mf-storyboard__link-chip">{e.data?.prompt?.slice(0, 20) || other?.data?.name || "connected"}</span>;
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!sorted.length && <p className="text-[#5A5A5E] text-[13px] text-center py-8">No cards yet.</p>}
      </div>
    </div>
  );
}
