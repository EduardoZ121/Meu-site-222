import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import useTitle from "../lib/useTitle";

export default function Register() {
  useTitle("Sign up");
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    referral_code: params.get("ref") || "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Welcome — 50 credits granted.");
      navigate("/app/generate");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="register-page">
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-heading italic text-[22px] text-rp-text">Remake</span>
          <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rp-mute">Pixel</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">Begin</p>
          <h1 className="heading-lg mb-3">Open your <span className="italic text-rp-lavender">studio</span>.</h1>
          <p className="text-rp-mute text-sm mb-10">50 credits, free. No card required.</p>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Name</label>
              <input name="name" value={form.name} onChange={onChange} className="field-input" placeholder="Your name" data-testid="register-name" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} required className="field-input" placeholder="you@studio.com" data-testid="register-email" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Password</label>
              <input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} className="field-input" data-testid="register-password" />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Referral code (optional)</label>
              <input name="referral_code" value={form.referral_code} onChange={onChange} className="field-input" placeholder="—" data-testid="register-referral" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" data-testid="register-submit">
              {loading ? "Creating…" : "Create my studio"}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            Already have an account?{" "}
            <Link to="/login" className="text-rp-lavender hover:underline" data-testid="register-go-login">Sign in →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
