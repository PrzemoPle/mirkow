import { assertNever } from "../game/assert-never";
import type { AvatarId } from "../game/types";
import { svgEl } from "./dom";

function attr(
  node: SVGElement,
  attributes: Record<string, string | number>,
): void {
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
}

function portraitFrame(build: (root: SVGSVGElement) => void): SVGSVGElement {
  const svg = svgEl("svg");
  attr(svg, {
    viewBox: "0 0 64 64",
    class: "avatar-art",
    "aria-hidden": "true",
  });
  build(svg);
  return svg;
}

function fillPath(root: SVGSVGElement, d: string, className: string): void {
  const node = svgEl("path");
  attr(node, { d, class: className });
  root.append(node);
}

function fillCircle(
  root: SVGSVGElement,
  cx: number,
  cy: number,
  r: number,
  className: string,
): void {
  const node = svgEl("circle");
  attr(node, { cx, cy, r, class: className });
  root.append(node);
}

function strokePath(root: SVGSVGElement, d: string): void {
  const node = svgEl("path");
  attr(node, {
    d,
    class: "avatar-line",
  });
  root.append(node);
}

function drawOla(root: SVGSVGElement): void {
  fillPath(root, "M12 58 C14 44 20 38 32 38 C44 38 50 44 52 58 Z", "avatar-cloth");
  fillCircle(root, 32, 28, 14, "avatar-skin");
  fillPath(
    root,
    "M18 28 C18 14 24 10 32 10 C40 10 46 14 46 28 C42 22 38 20 32 20 C26 20 22 22 18 28 Z",
    "avatar-hair",
  );
  strokePath(root, "M24 27 a5 5 0 1 1 0.1 0 M40 27 a5 5 0 1 1 0.1 0 M29 27 H35");
  strokePath(root, "M27 36 C30 38 34 38 37 36");
}

function drawBartek(root: SVGSVGElement): void {
  fillPath(root, "M11 58 C14 42 20 37 32 37 C44 37 50 42 53 58 Z", "avatar-cloth");
  fillCircle(root, 32, 29, 13, "avatar-skin");
  fillPath(root, "M16 24 H48 L44 16 H20 Z", "avatar-hair");
  fillPath(root, "M22 16 H42 L40 10 H24 Z", "avatar-hair");
  strokePath(root, "M26 30 H30 M34 30 H38");
  strokePath(root, "M28 36 C31 38 33 38 36 36");
}

function drawNati(root: SVGSVGElement): void {
  fillPath(root, "M12 58 C16 43 22 39 32 39 C42 39 48 43 52 58 Z", "avatar-cloth");
  fillCircle(root, 32, 29, 13, "avatar-skin");
  fillCircle(root, 18, 24, 8, "avatar-hair");
  fillCircle(root, 46, 24, 8, "avatar-hair");
  fillCircle(root, 32, 14, 9, "avatar-hair");
  strokePath(root, "M26 30 H29 M35 30 H38");
  strokePath(root, "M27 36 C31 39 33 39 37 36");
}

function drawMarek(root: SVGSVGElement): void {
  fillPath(root, "M10 58 C14 41 20 36 32 36 C44 36 50 41 54 58 Z", "avatar-cloth");
  fillCircle(root, 32, 28, 13, "avatar-skin");
  fillPath(root, "M20 20 C22 12 28 10 32 10 C36 10 42 12 44 20 L42 24 H22 Z", "avatar-hair");
  strokePath(root, "M26 29 H29 M35 29 H38");
  strokePath(root, "M24 34 C28 38 36 38 40 34");
  fillCircle(root, 24, 33, 1.1, "avatar-hair");
  fillCircle(root, 40, 33, 1.1, "avatar-hair");
}

export function avatarPortrait(id: AvatarId): SVGSVGElement {
  switch (id) {
    case "ola":
      return portraitFrame(drawOla);
    case "bartek":
      return portraitFrame(drawBartek);
    case "nati":
      return portraitFrame(drawNati);
    case "marek":
      return portraitFrame(drawMarek);
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}
