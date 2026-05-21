import { Component } from "react";

export default class MangaStudioErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-2xl border border-red-500/40 bg-[#1a1a2e] p-6 max-w-lg mx-auto my-8"
          data-testid="manga-studio-error"
        >
          <h2 className="text-white text-lg font-semibold mb-2">Manga Studio — erro</h2>
          <p className="text-[#9CA3AF] text-sm mb-4">
            Algo falhou ao carregar o editor. Podes tentar de novo ou carregar o projeto demo.
          </p>
          <pre className="text-[11px] text-red-300/90 overflow-auto max-h-24 mb-4 p-2 bg-black/40 rounded">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="manga-cta-btn min-h-[44px] px-4"
              onClick={() => {
                try {
                  localStorage.removeItem("rp_manga_projects");
                  localStorage.removeItem("rp_manga_active_id");
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
            >
              Limpar dados e recarregar
            </button>
            <button
              type="button"
              className="manga-secondary-cta min-h-[44px] px-4"
              onClick={() => this.setState({ error: null })}
            >
              Tentar outra vez
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
