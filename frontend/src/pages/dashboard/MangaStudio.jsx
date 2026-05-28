import { Component } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import MangaFlowEditor from "../../components/manga-flow/MangaFlowEditor";
import "../../styles/manga-flow.css";

class MangaStudioErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[MangaStudio]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="manga-studio-fallback" data-testid="manga-studio-error">
          <h2 className="manga-studio-fallback__title">Manga Studio could not start</h2>
          <p className="manga-studio-fallback__msg">{this.state.error?.message || "Unknown error"}</p>
          <button type="button" className="manga-flow-btn manga-flow-btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Manga Studio — visual flow editor for manga pages.
 */
export default function MangaStudio() {
  return (
    <MangaStudioErrorBoundary>
      <div className="manga-studio-page" data-testid="manga-studio-page">
        <ReactFlowProvider>
          <MangaFlowEditor />
        </ReactFlowProvider>
      </div>
    </MangaStudioErrorBoundary>
  );
}
