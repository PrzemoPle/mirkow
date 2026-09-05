import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource-variable/bricolage-grotesque";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/game.css";
import "./styles/overlays.css";
import "./styles/setup.css";
import { registerServiceWorker } from "./pwa";
import { renderApp } from "./ui/app";

const app = document.getElementById("app");

if (app === null) {
  throw new Error("Missing #app root");
}

renderApp(app);
registerServiceWorker();
