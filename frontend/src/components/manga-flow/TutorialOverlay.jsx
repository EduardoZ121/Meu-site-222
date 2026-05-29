import { useState } from "react";
import { HelpCircle, ChevronRight, X, Sparkles } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to Manga Flow Studio",
    body: "Create manga pages by placing cards on the canvas and connecting them. Each card represents a character, place, or object in your story.",
    icon: "🎌",
  },
  {
    title: "1. Add Cards",
    body: "Tap 'Add Card' to place a Person, Scenario, or Object on the canvas. Each type has its own configuration.",
    icon: "➕",
  },
  {
    title: "2. Configure Cards",
    body: "Tap any card to open its inspector. Set the character's name, pose, emotion, upload a reference photo, add speech bubbles, and more.",
    icon: "⚙️",
  },
  {
    title: "3. Connect Cards",
    body: "Drag from one card's handle to another to create a connection. A prompt bar will appear — describe what's happening between them.",
    icon: "🔗",
  },
  {
    title: "4. Card Positions = Panel Layout",
    body: "Where you place cards on the canvas defines the manga panel layout. Cards on the left = left panel, cards on the right = right panel. Each canvas is one page.",
    icon: "📐",
  },
  {
    title: "5. Reference Images",
    body: "Upload reference photos for characters and scenarios. The AI will use them to maintain consistency across panels.",
    icon: "🖼️",
  },
  {
    title: "Ready to create!",
    body: "Start by adding a Person card and a Scenario card. Connect them to describe where the character is. Then generate your manga panel.",
    icon: "✨",
  },
];

export default function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="manga-flow-modal-overlay" onClick={onClose} data-testid="tutorial-overlay">
      <div className="manga-flow-tutorial" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="manga-flow-tutorial__close"><X className="w-4 h-4" /></button>
        <div className="manga-flow-tutorial__icon">{current.icon}</div>
        <h3 className="manga-flow-tutorial__title">{current.title}</h3>
        <p className="manga-flow-tutorial__body">{current.body}</p>
        <div className="manga-flow-tutorial__dots">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} className={`manga-flow-tutorial__dot ${i === step ? "manga-flow-tutorial__dot--active" : ""}`} />
          ))}
        </div>
        <div className="manga-flow-tutorial__actions">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="manga-flow-btn">Back</button>}
          <button onClick={isLast ? onClose : () => setStep(step + 1)} className="manga-flow-btn manga-flow-btn-primary">
            {isLast ? (<><Sparkles className="w-4 h-4" /> Start creating</>) : (<>Next <ChevronRight className="w-4 h-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
