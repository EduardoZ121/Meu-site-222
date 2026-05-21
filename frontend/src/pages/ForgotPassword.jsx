import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
import { useAuth } from "../lib/auth";
import useTitle from "../lib/useTitle";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  useTitle("Recuperar palavra-passe");
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.mode === "local") {
        const link = `${window.location.origin}/reset-password?token=${encodeURIComponent(result.token)}`;
        setResetLink(link);
        toast.success("Link local de recuperação criado.");
      } else {
        toast.success("Se existir conta com este email, enviámos instruções de recuperação.");
      }
    } catch (err) {
      toast.error(err?.message || "Falhou a recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(resetLink);
    toast.success("Link copiado.");
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="forgot-page">
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">Segurança</p>
          <h1 className="heading-lg mb-3">Recuperar <span className="italic text-rp-lavender">acesso</span>.</h1>
          <p className="text-rp-mute text-sm mb-10">Escreve o email da tua conta para criares um link de recuperação.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="field-input" placeholder="tu@email.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              <Mail className="w-4 h-4" /> {loading ? "A preparar..." : "Enviar recuperação"}
            </button>
          </form>

          {resetLink && (
            <div className="mt-6 border border-rp-border bg-rp-surface p-4">
              <p className="text-rp-mute text-xs leading-relaxed mb-3">
                Enquanto o email real não está ligado ao backend, usa este link local neste dispositivo:
              </p>
              <button onClick={copyLink} className="btn-secondary w-full !justify-center !text-[10px]">
                <Copy className="w-3.5 h-3.5" /> Copiar link local
              </button>
            </div>
          )}

          <p className="text-rp-mute text-sm mt-10">
            Lembraste da palavra-passe?{" "}
            <Link to="/login" className="text-rp-lavender hover:underline">Entrar →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
