import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import { Save, Zap, Scale, Sparkles, Globe, Bell, Moon, Image as ImageIcon, Hash, Bot } from "lucide-react";

const ASPECTS = ["1:1", "4:5", "9:16", "16:9", "3:2"];
const PERSONALITIES = [
  { id: "creative",     label: "Criativo",     desc: "Sugestões fora-da-caixa, mais arte" },
  { id: "technical",    label: "Técnico",      desc: "Linguagem precisa, foco no detalhe" },
  { id: "casual",       label: "Casual",       desc: "Tom relaxado e direto" },
  { id: "professional", label: "Profissional", desc: "Saída editorial e polida" },
];
const QUALITIES = [
  { id: "fast",     label: "Rápida",     desc: "Velocidade primeiro" },
  { id: "balanced", label: "Equilibrada", desc: "Recomendado" },
  { id: "high",     label: "Alta",        desc: "Máxima fidelidade" },
];
const MODES = [
  { id: "creative",  label: "Criativo",   desc: "Mais variação artística" },
  { id: "balanced",  label: "Equilibrado", desc: "Recomendado" },
  { id: "realistic", label: "Realista",    desc: "Mantém-se fiel à realidade" },
];

export default function Settings() {
  const { t, lang, switchLang, langs } = useI18n();
  useTitle(t("sidebar_settings"));
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => toast.error("Erro a carregar definições."));
  }, []);

  if (!settings) {
    return <p className="text-[#8A8A8E] text-sm">A carregar…</p>;
  }

  const update = (k, v) => { setSettings({ ...settings, [k]: v }); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      if (settings.lang) switchLang(settings.lang);
      toast.success("Definições guardadas.");
      setDirty(false);
    } catch {
      toast.error("Falhou a guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto pb-32" data-testid="settings-page">
      {/* === Header === */}
      <header className="mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">Preferências</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-4">
          As <span className="italic text-[#C4B5FD]">tuas</span> definições.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[560px]">
          Personaliza a forma como geras, a personalidade da IA e a tua experiência no Remake Pixel.
        </p>
      </header>

      <div className="space-y-10">
        {/* Geração */}
        <Group icon={<ImageIcon className="w-4 h-4" />} label="Geração">
          <Block label="Formato por Defeito" icon={<ImageIcon className="w-3.5 h-3.5" />}>
            <ChipRow>
              {ASPECTS.map((a) => (
                <Chip key={a} active={settings.aspect_ratio_default === a} onClick={() => update("aspect_ratio_default", a)} testId={`ar-${a}`}>{a}</Chip>
              ))}
            </ChipRow>
          </Block>

          <Block label="Variações por Defeito" icon={<Hash className="w-3.5 h-3.5" />}>
            <ChipRow>
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} active={settings.num_variations_default === n} onClick={() => update("num_variations_default", n)} square testId={`var-${n}`}>{n}</Chip>
              ))}
            </ChipRow>
          </Block>

          <Block label="Qualidade Padrão" icon={<Zap className="w-3.5 h-3.5" />}>
            <CardRow>
              {QUALITIES.map((q) => (
                <Card key={q.id} active={settings.quality === q.id} onClick={() => update("quality", q.id)} testId={`q-${q.id}`}>
                  <p className="text-[14px] font-medium text-[#F4F1EA]">{q.label}</p>
                  <p className="text-[11px] text-[#8A8A8E]">{q.desc}</p>
                </Card>
              ))}
            </CardRow>
          </Block>

          <Block label="Modo de Geração" icon={<Scale className="w-3.5 h-3.5" />}>
            <CardRow>
              {MODES.map((m) => (
                <Card key={m.id} active={settings.generation_mode === m.id} onClick={() => update("generation_mode", m.id)} testId={`mode-${m.id}`}>
                  <p className="text-[14px] font-medium text-[#F4F1EA]">{m.label}</p>
                  <p className="text-[11px] text-[#8A8A8E]">{m.desc}</p>
                </Card>
              ))}
            </CardRow>
          </Block>
        </Group>

        {/* IA */}
        <Group icon={<Bot className="w-4 h-4" />} label="Inteligência Artificial">
          <Block label="Personalidade da IA" icon={<Sparkles className="w-3.5 h-3.5" />}>
            <CardRow>
              {PERSONALITIES.map((p) => (
                <Card key={p.id} active={settings.personality === p.id} onClick={() => update("personality", p.id)} testId={`personality-${p.id}`}>
                  <p className="text-[14px] font-medium text-[#F4F1EA]">{p.label}</p>
                  <p className="text-[11px] text-[#8A8A8E]">{p.desc}</p>
                </Card>
              ))}
            </CardRow>
          </Block>
        </Group>

        {/* Interface */}
        <Group icon={<Globe className="w-4 h-4" />} label="Interface">
          <Block label="Idioma" icon={<Globe className="w-3.5 h-3.5" />}>
            <ChipRow>
              {langs.map((l) => (
                <Chip key={l} active={settings.lang === l} onClick={() => update("lang", l)} testId={`lang-${l}`}>{l.toUpperCase()}</Chip>
              ))}
            </ChipRow>
          </Block>

          <Block label="Tema" icon={<Moon className="w-3.5 h-3.5" />}>
            <ChipRow>
              <Chip active disabled>Dark</Chip>
              <Chip active={false} disabled>Light · em breve</Chip>
            </ChipRow>
          </Block>

          <Block label="Notificações" icon={<Bell className="w-3.5 h-3.5" />}>
            <ToggleRow>
              <Toggle active={!!settings.notifications} onClick={() => update("notifications", !settings.notifications)} testId="toggle-notifs">
                Receber notificações de geração
              </Toggle>
            </ToggleRow>
          </Block>
        </Group>
      </div>

      {/* === Sticky save bar === */}
      <div className={`fixed bottom-6 right-6 z-20 transition-all ${dirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white text-[12px] font-mono uppercase tracking-[0.16em] shadow-2xl shadow-[#7C3AED]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50" data-testid="settings-save">
          <Save className="w-4 h-4" />
          {saving ? "A guardar…" : "Guardar Alterações"}
        </button>
      </div>
    </div>
  );
}

function Group({ icon, label, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-5 text-[#7C3AED]">
        {icon}
        <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD]">{label}</h2>
        <div className="flex-1 h-px bg-[#2E2E30]" />
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Block({ label, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 text-[#8A8A8E]">
        {icon}
        <p className="text-[11px] font-mono uppercase tracking-[0.18em]">{label}</p>
      </div>
      {children}
    </div>
  );
}

function ChipRow({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({ active, onClick, disabled, square, children, testId }) {
  const base = square ? "w-12 h-12 flex items-center justify-center" : "px-4 py-2.5";
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} data-testid={testId}
      className={`${base} rounded-md text-[11px] font-mono uppercase tracking-[0.12em] transition-all
        ${active
          ? "border border-[#7C3AED] bg-[#7C3AED]/15 text-[#F4F1EA] shadow-[0_0_24px_-8px_rgba(124,58,237,0.6)]"
          : "border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#5A5A5E]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
}

function CardRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">{children}</div>;
}

function Card({ active, onClick, children, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className={`text-left px-4 py-3.5 rounded-lg border transition-all
        ${active
          ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
          : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E] hover:bg-[#13131A]"}`}>
      {children}
    </button>
  );
}

function ToggleRow({ children }) { return <div className="space-y-2">{children}</div>; }
function Toggle({ active, onClick, children, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all
        ${active
          ? "border-[#7C3AED] bg-[#7C3AED]/10"
          : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"}`}>
      <span className="text-[#F4F1EA] text-[13px]">{children}</span>
      <span className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${active ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform translate-y-0.5 ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
