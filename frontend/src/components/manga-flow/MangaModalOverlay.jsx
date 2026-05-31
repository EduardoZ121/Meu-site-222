import Portal from "../Portal";

export default function MangaModalOverlay({ children, onClose, testId }) {
  return (
    <Portal>
      <div
        className="manga-flow-modal-overlay"
        onClick={onClose}
        data-testid={testId}
        role="presentation"
      >
        {children}
      </div>
    </Portal>
  );
}
