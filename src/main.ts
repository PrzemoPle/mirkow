import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource-variable/bricolage-grotesque";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/game.css";
import "./styles/overlays.css";
import "./styles/setup.css";
import { registerSW } from "virtual:pwa-register";
import { renderApp } from "./ui/app";

const app = document.getElementById("app");

if (app === null) {
  throw new Error("Missing #app root");
}

renderApp(app);
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
