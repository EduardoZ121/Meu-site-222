import { useEffect, useRef } from "react";

/**
 * Liga um overlay (dropdown de notificações, menu de perfil, drawer mobile, modal)
 * ao histórico do browser, para que o botão físico "voltar" do Android/Samsung
 * feche APENAS o overlay em vez de navegar para fora do site / voltar tudo de uma vez.
 *
 * Padrão: ao abrir, empurra uma entrada "marcador" no histórico (mesmo URL, invisível).
 * Quando o utilizador carrega em voltar, o `popstate` consome esse marcador e fecha o
 * overlay — um passo de cada vez. Se o overlay for fechado por outro meio (clique fora,
 * Esc, escolher um item), limpa o marcador com replaceState (NÃO history.back) para
 * não disparar o StudioNavContext e saltar a sessão inteira.
 *
 * @param {boolean} isOpen        se o overlay está aberto
 * @param {() => void} onClose    callback para fechar o overlay
 */
export function useBackClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pushedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!pushedRef.current) {
        try {
          // Só marca overlay — não copiar rpStudioBack para o topo,
          // para o pop distinguir "fechar menu" de "sair da sessão".
          window.history.pushState(
            { rpOverlay: true },
            "",
            window.location.href,
          );
        } catch {
          /* histórico indisponível — ignora */
        }
        pushedRef.current = true;
      }

      const onPop = () => {
        // Voltar pressionado com o overlay aberto -> apenas fecha o overlay.
        pushedRef.current = false;
        onCloseRef.current?.();
      };
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }

    // Overlay fechado por outro meio: limpar marcador sem history.back().
    if (pushedRef.current) {
      pushedRef.current = false;
      try {
        if (window.history.state?.rpOverlay) {
          const next = { ...(window.history.state || {}) };
          delete next.rpOverlay;
          window.history.replaceState(next, "", window.location.href);
        }
      } catch {
        /* ignora */
      }
    }
    return undefined;
  }, [isOpen]);
}
