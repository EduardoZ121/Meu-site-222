import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import useTitle from "../lib/useTitle";
import Logo from "../components/Logo";
import PublicLanguageBar from "../components/PublicLanguageBar";

export default function ResetPassword() {
  useTitle("Nova palavra-passe");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A palavra-passe precisa de pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Palavra-passe atualizada.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Falhou a atualização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="reset-page">
      <PublicLanguageBar testId="reset-lang-bar" />
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">Conta</p>
          <h1 className="heading-lg mb-10">Criar nova <span className="italic text-rp-lavender">palavra-passe</span>.</h1>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Código / token</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} required className="field-input" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Nova palavra-passe</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required className="field-input" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Confirmar palavra-passe</label>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" minLength={6} required className="field-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "A guardar..." : "Atualizar palavra-passe"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
