let fastForward = false;

/** Gdy gracz pomija turę bota, animacje i pauzy skracają się do zera. */
export function setFastForward(on: boolean): void {
  fastForward = on;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function wait(ms: number): Promise<void> {
  const delay = fastForward ? 0 : prefersReducedMotion() ? Math.min(ms, 60) : ms;
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
  if (fastForward || prefersReducedMotion() || typeof node.animate !== "function") {
    node.style.transform = to;
    return;
  }
  const animation = node.animate([{ transform: from }, { transform: to }], {
    duration,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  });
  // Ukryta karta nie renderuje klatek: limit czasu, żeby gra nigdy nie utknęła w ruchu.
  const deadline = new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration + 250);
  });
  try {
    await Promise.race([animation.finished.then(() => undefined), deadline]);
  } catch {
    // Anulowane przez nowy ruch: zostawiamy końcową pozycję.
  }
  node.style.transform = to;
  animation.cancel();
}
