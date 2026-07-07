import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { isAdminUser } from "../../lib/isAdmin";
import MangaStudio from "./MangaStudio";

/** Manga Studio — apenas administradores (oculto do público). */
export default function MangaStudioGate() {
  const { user } = useAuth();
  if (!isAdminUser(user)) {
    return <Navigate to="/app/tools" replace />;
  }
  return <MangaStudio />;
}
