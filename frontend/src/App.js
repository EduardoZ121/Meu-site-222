import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./lib/auth";
import { I18nProvider } from "./lib/i18n";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/dashboard/Layout";
import Generate from "./pages/dashboard/Generate";
import Gallery from "./pages/dashboard/Gallery";
import Billing from "./pages/dashboard/Billing";
import Profile from "./pages/dashboard/Profile";
import Referrals from "./pages/dashboard/Referrals";
import Admin from "./pages/dashboard/Admin";

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
    <div className="App">
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: "#121217", color: "#F4F1EA", border: "1px solid rgba(244,241,234,0.08)" } }} />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/app" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/app/generate" replace />} />
                <Route path="generate" element={<Generate />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="favorites" element={<Gallery favoritesOnly />} />
                <Route path="billing" element={<Billing />} />
                <Route path="profile" element={<Profile />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="admin" element={<RequireAuth adminOnly><Admin /></RequireAuth>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </div>
  );
}

export default App;
