import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { AuthProvider, useAuth } from "./lib/auth";
import { PricingProvider } from "./lib/PricingContext";
import { isPwaStandalone } from "./lib/pwaMode";

import Landing from "./pages/Landing";
import Discover from "./pages/Discover";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import DashboardLayout from "./pages/dashboard/Layout";
import HubMainLayout from "./layouts/HubMainLayout";
import StudioWorkspaceLayout from "./layouts/StudioWorkspaceLayout";
import Tools from "./pages/dashboard/Tools";
import Generate from "./pages/dashboard/Generate";
import Pro from "./pages/dashboard/Pro";
import Artistic from "./pages/dashboard/Artistic";
import Video from "./pages/dashboard/Video";
import VideoFlow from "./pages/dashboard/VideoFlow";
import MarketingVideo from "./pages/dashboard/MarketingVideo";
import MotionFlyer from "./pages/dashboard/MotionFlyer";
import Posters from "./pages/dashboard/Posters";
import MangaStudioGate from "./pages/dashboard/MangaStudioGate";
import Wizard from "./pages/dashboard/Wizard";
import Suggest from "./pages/dashboard/Suggest";
import SettingsPage from "./pages/dashboard/Settings";
import Gallery from "./pages/dashboard/Gallery";
import Billing from "./pages/dashboard/Billing";
import Profile from "./pages/dashboard/Profile";
import Referrals from "./pages/dashboard/Referrals";
import Admin from "./pages/dashboard/Admin";
import BgRemove from "./pages/dashboard/tools/BgRemove";
import Upscale from "./pages/dashboard/tools/Upscale";
import Restore from "./pages/dashboard/tools/Restore";
import Colorize from "./pages/dashboard/tools/Colorize";
import Inpaint from "./pages/dashboard/tools/Inpaint";
import ClothesChanger from "./pages/dashboard/tools/ClothesChanger";
import BuildVersionGuard from "./components/BuildVersionGuard";
import CookieConsentBar from "./components/legal/CookieConsentBar";
import WhatsAppGenerationListener from "./components/legal/WhatsAppGenerationListener";
import Legal from "./pages/Legal";

/** App instalado (Chrome): abre login em vez da landing; sessão autenticada vai ao estúdio. */
function PwaStartupRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isPwaStandalone() || loading) return;
    const path = location.pathname;
    if (user && (path === "/" || path === "/login")) {
      navigate("/app/tools", { replace: true });
      return;
    }
    if (!user && path === "/") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}

function BackgroundGenerationRedirect() {
  const location = useLocation();

  useEffect(() => {
    const onFailed = (event) => {
      const detail = event?.detail || {};
      if (detail.source !== "background") return;
      toast.error(detail.error || "A geração falhou.");
    };
    window.addEventListener("rp:prediction-failed", onFailed);
    return () => {
      window.removeEventListener("rp:prediction-failed", onFailed);
    };
  }, [location.pathname]);

  return null;
}

function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen bg-rp-bg" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/app/generate" replace />;
  return children;
}

function App() {
  return (
    <div className="App touch-manipulation min-h-screen overflow-x-hidden">
      <AuthProvider>
          <PricingProvider>
          <BrowserRouter>
            <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: "#121217", color: "#F4F1EA", border: "1px solid rgba(244,241,234,0.08)" } }} />
            <BuildVersionGuard />
            <CookieConsentBar />
            <WhatsAppGenerationListener />
            <PwaStartupRedirect />
            <BackgroundGenerationRedirect />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/legal/:section" element={<Legal />} />
              <Route path="/legal" element={<Navigate to="/legal/terms" replace />} />
              <Route path="/studio" element={<Navigate to="/app/studio" replace />} />

              <Route path="/app" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/app/tools" replace />} />

                <Route element={<HubMainLayout />}>
                  <Route path="tools" element={<Tools />} />
                  <Route path="suggest" element={<Suggest />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="favorites" element={<Gallery favoritesOnly />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="referrals" element={<Referrals />} />
                  <Route path="admin" element={<RequireAuth adminOnly><Admin /></RequireAuth>} />
                </Route>

                <Route element={<StudioWorkspaceLayout />}>
                  <Route path="tools/bg-remove" element={<BgRemove />} />
                  <Route path="tools/upscale" element={<Upscale />} />
                  <Route path="tools/restore" element={<Restore />} />
                  <Route path="tools/colorize" element={<Colorize />} />
                  <Route path="tools/inpaint" element={<Inpaint />} />
                  <Route path="tools/clothes" element={<ClothesChanger />} />
                  <Route path="generate" element={<Generate />} />
                  <Route path="studio" element={<Generate />} />
                  <Route path="pro" element={<Pro />} />
                  <Route path="artistic" element={<Artistic />} />
                  <Route path="video" element={<Video />} />
                  <Route path="video/:mode" element={<VideoFlow />} />
                  <Route path="marketing-video" element={<MarketingVideo />} />
                  <Route path="motion-flyer" element={<MotionFlyer />} />
                  <Route path="posters" element={<Posters />} />
                  <Route path="manga-studio" element={<MangaStudioGate />} />
                  <Route path="carousel" element={<Navigate to="/app/manga-studio" replace />} />
                  <Route path="wizard" element={<Wizard />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </PricingProvider>
        </AuthProvider>
    </div>
  );
}

export default App;
