import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import useTitle from "../lib/useTitle";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Logo from "../components/Logo";

export default function Register() {
  useTitle("Criar conta");
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    referral_code: params.get("ref") || "",
  });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Bem-vindo — 50 créditos grátis adicionados.");
      navigate("/app/tools");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Falhou o registo");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Conta Google ligada.");
      navigate("/app/tools");
    } catch (err) {
      toast.error(err?.message || "Falhou a criar conta com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="register-page">
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">Começar</p>
          <h1 className="heading-lg mb-3">Abre o teu <span className="italic text-rp-lavender">estúdio</span>.</h1>
          <p className="text-rp-mute text-sm mb-10">50 créditos grátis. Sem cartão obrigatório.</p>

          <div className="mb-5">
            <GoogleAuthButton onCredential={onGoogle} label="Criar com Google" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Nome</label>
              <input name="name" value={form.name} onChange={onChange} className="field-input" placeholder="O teu nome" data-testid="register-name" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} required className="field-input" placeholder="you@studio.com" data-testid="register-email" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Palavra-passe</label>
              <input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} className="field-input" data-testid="register-password" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Código de convite (opcional)</label>
              <input name="referral_code" value={form.referral_code} onChange={onChange} className="field-input" placeholder="—" data-testid="register-referral" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" data-testid="register-submit">
              {loading ? "A criar…" : "Criar o meu estúdio"}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            Já tens conta?{" "}
            <Link to="/login" className="text-rp-lavender hover:underline" data-testid="register-go-login">Entrar →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
