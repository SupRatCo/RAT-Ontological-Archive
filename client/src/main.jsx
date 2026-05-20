import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/forum.css";
import "./styles/documents.css";
import "./styles/data-files.css";
import "./styles/gallery.css";
import "./styles/profile.css";
import "./styles/settings.css";
import "./styles/responsive.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
