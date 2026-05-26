import React from "react";
import ReactDOM from "react-dom/client";
import { markPwaSessionFromUrl } from "@/lib/pwaMode";
import { syncClientBuildWithServer } from "@/lib/clientBuildSync";
import "@/i18n";
import "@/index.css";
import App from "@/App";

markPwaSessionFromUrl();

const root = ReactDOM.createRoot(document.getElementById("root"));

async function boot() {
  await syncClientBuildWithServer();
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

boot();
