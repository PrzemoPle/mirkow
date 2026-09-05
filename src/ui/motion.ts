export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function wait(ms: number): Promise<void> {
  const delay = prefersReducedMotion() ? Math.min(ms, 60) : ms;
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

export async function slide(
  node: HTMLElement,
  from: string,
  to: string,
  duration: number,
): Promise<void> {
  if (prefersReducedMotion() || typeof node.animate !== "function") {
    node.style.transform = to;
    return;
  }
  const animation = node.animate([{ transform: from }, { transform: to }], {
    duration,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  });
  try {
    await animation.finished;
  } catch {
    // Anulowane przez nowy ruch: zostawiamy końcową pozycję.
  }
  node.style.transform = to;
  animation.cancel();
}
