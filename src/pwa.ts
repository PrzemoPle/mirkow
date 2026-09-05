export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const scriptUrl = new URL("sw.js", document.baseURI);

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(scriptUrl).catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  });
}
