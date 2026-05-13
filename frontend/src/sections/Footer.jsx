import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Footer() {
  return (
    <footer className="relative bg-[#0B0B0C] border-t border-[#2E2E30]" data-testid="footer-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-center justify-center mb-6">
          <Logo to="/" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 mb-6">
          {["Generate", "Edit", "Pricing", "Gallery", "Login", "Terms", "Privacy"].map((l) => (
            <Link
              key={l}
              to={l === "Login" ? "/login" : l === "Pricing" ? "/#pricing" : "/"}
              className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.12em] hover:text-[#8A8A8E] transition-colors"
            >
              {l}
            </Link>
          ))}
          <a
            href="https://instagram.com/remake_pix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.12em] hover:text-[#7C3AED] transition-colors"
          >
            @remake_pix
          </a>
        </div>

        <p className="text-center text-[#5A5A5E] text-[10px] font-mono">&copy; 2026 Remake Pixel. Crafted in pixels.</p>
      </div>
    </footer>
  );
}
