import { Component } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import MangaFlowEditor from "../../components/manga-flow/MangaFlowEditor";
import { useI18n } from "../../lib/i18n";
import "../../styles/manga-flow.css";

function MangaStudioErrorFallback({ error, t }) {
  return (
    <div className="manga-studio-fallback" data-testid="manga-studio-error">
      <h2 className="manga-studio-fallback__title">{t("manga_studio_err_title")}</h2>
      <p className="manga-studio-fallback__msg">{error?.message || t("common_fail")}</p>
      <button
        type="button"
        className="manga-flow-btn manga-flow-btn-primary"
        onClick={() => window.location.reload()}
      >
        {t("manga_studio_err_reload")}
      </button>
    </div>
  );
}

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
      return <MangaStudioErrorFallback error={this.state.error} t={this.props.t} />;
    }
    return this.props.children;
  }
}

/** Manga Studio — visual flow editor (TUDO-FINAL). */
export default function MangaStudio() {
  const { t } = useI18n();
  return (
    <MangaStudioErrorBoundary t={t}>
      <div className="manga-studio-page" data-testid="manga-studio-page">
        <ReactFlowProvider>
          <MangaFlowEditor />
        </ReactFlowProvider>
      </div>
    </MangaStudioErrorBoundary>
  );
}
