import { X, BarChart3 } from "lucide-react";

export default function StatsPanel({ nodes, edges, pages, onClose }) {
  const byType = {};
  for (const n of nodes) byType[n.type] = (byType[n.type] || 0) + 1;
  const withRef = nodes.filter(n => n.data?.refImageUrl).length;
  const withSpeech = nodes.filter(n => n.data?.speech || n.data?.text).length;
  const condEdges = edges.filter(e => e.data?.condition?.value).length;

  return (
    <div className="manga-flow-modal-overlay" onClick={onClose}>
      <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="manga-flow-modal__header">
          <BarChart3 className="w-5 h-5 text-[#A855F7]" />
          <h3 className="manga-flow-modal__title">Page Statistics</h3>
          <button onClick={onClose} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <div className="mf-stats-grid">
            <div className="mf-stats-card"><span className="mf-stats-num">{nodes.length}</span><span className="mf-stats-label">Total Cards</span></div>
            <div className="mf-stats-card"><span className="mf-stats-num">{edges.length}</span><span className="mf-stats-label">Connections</span></div>
            <div className="mf-stats-card"><span className="mf-stats-num">{pages || 1}</span><span className="mf-stats-label">Pages</span></div>
            <div className="mf-stats-card"><span className="mf-stats-num">{withRef}</span><span className="mf-stats-label">With Reference</span></div>
            <div className="mf-stats-card"><span className="mf-stats-num">{withSpeech}</span><span className="mf-stats-label">With Dialogue</span></div>
            <div className="mf-stats-card"><span className="mf-stats-num">{condEdges}</span><span className="mf-stats-label">Conditional</span></div>
          </div>
          <div className="mf-stats-breakdown">
            <p className="mf-stats-breakdown__title">By Type:</p>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="mf-stats-breakdown__row">
                <span className="mf-stats-breakdown__type">{type}</span>
                <div className="mf-stats-breakdown__bar" style={{ width: `${Math.min(100, (count / Math.max(nodes.length, 1)) * 100)}%` }} />
                <span className="mf-stats-breakdown__count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
