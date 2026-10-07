import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./styles/enhance.css";
import "./styles/about.css";
import "./styles/hero.css";
import "./styles/skills.css";
import "./styles/preloader.css";
import "./styles/projects3d.css";
import "./styles/palette.css";
import "./styles/extras.css";
import "./styles/contact.css";
import "./styles/world.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
