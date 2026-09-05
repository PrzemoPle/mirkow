import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "./styles.css";
import { registerServiceWorker } from "./pwa";
import { renderApp } from "./ui/render-app";

const app = document.getElementById("app");

if (app === null) {
  throw new Error("Missing #app root");
}

renderApp(app);
registerServiceWorker();
