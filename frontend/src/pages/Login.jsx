import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/app/generate";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate(from);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="login-page">
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-heading italic text-[22px] text-rp-text">Remake</span>
          <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rp-mute">Pixel</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-[420px]">
          <p className="eyebrow mb-5">Welcome back</p>
          <h1 className="heading-lg mb-10">Continue your <span className="italic text-rp-lavender">craft</span>.</h1>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@studio.com" className="field-input" data-testid="login-email" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="field-input" data-testid="login-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" data-testid="login-submit">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            New to Remake Pixel?{" "}
            <Link to="/register" className="text-rp-lavender hover:underline" data-testid="login-go-register">Create an account →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
