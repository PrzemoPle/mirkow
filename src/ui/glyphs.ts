import { assertNever } from "../game/assert-never";
import type { LocationId } from "../game/catalog";
import { svgEl } from "./dom";

function attr(
  node: SVGElement,
  attributes: Record<string, string | number>,
): void {
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
}

function strokeGroup(): SVGGElement {
  const group = svgEl("g");
  attr(group, {
    fill: "currentColor",
    "fill-opacity": 0.16,
    stroke: "currentColor",
    "stroke-width": 1.7,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  return group;
}

function path(group: SVGGElement, d: string): void {
  const node = svgEl("path");
  attr(node, { d });
  group.append(node);
}

function circle(
  group: SVGGElement,
  cx: number,
  cy: number,
  r: number,
): void {
  const node = svgEl("circle");
  attr(node, { cx, cy, r });
  group.append(node);
}

function line(
  group: SVGGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const node = svgEl("line");
  attr(node, { x1, y1, x2, y2 });
  group.append(node);
}

function rect(
  group: SVGGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  rx = 0,
): void {
  const node = svgEl("rect");
  attr(node, { x, y, width, height, rx });
  group.append(node);
}

function canvas(build: (group: SVGGElement) => void): SVGSVGElement {
  const svg = svgEl("svg");
  attr(svg, {
    viewBox: "0 0 72 44",
    class: "glyph",
    "aria-hidden": "true",
  });
  const group = strokeGroup();
  build(group);
  svg.append(group);
  return svg;
}

function drawPup(group: SVGGElement): void {
  rect(group, 8, 18, 56, 18, 2);
  line(group, 8, 26, 64, 26);
  rect(group, 48, 10, 12, 10, 1);
  line(group, 54, 10, 54, 6);
  path(group, "M14 36 v-6 h8 v6");
  path(group, "M28 36 v-6 h8 v6");
  path(group, "M42 36 v-6 h8 v6");
}

function drawCampus(group: SVGGElement): void {
  rect(group, 8, 16, 16, 22, 1);
  rect(group, 28, 8, 16, 30, 1);
  rect(group, 48, 14, 16, 24, 1);
  line(group, 12, 22, 20, 22);
  line(group, 32, 16, 40, 16);
  line(group, 52, 20, 60, 20);
  circle(group, 18, 38, 3);
  circle(group, 28, 38, 3);
  path(group, "M18 38 L23 32 L28 38 M23 32 V28");
}

function drawBank(group: SVGGElement): void {
  circle(group, 36, 24, 14);
  circle(group, 36, 24, 7);
  circle(group, 36, 12, 1.4);
  circle(group, 36, 36, 1.4);
  circle(group, 24, 24, 1.4);
  circle(group, 48, 24, 1.4);
  line(group, 36, 24, 44, 20);
}

function drawCafe(group: SVGGElement): void {
  rect(group, 6, 8, 34, 28, 2);
  line(group, 23, 8, 23, 36);
  line(group, 6, 22, 40, 22);
  path(group, "M44 28 h14 a6 6 0 0 1 0 8 H44 Z");
  path(group, "M58 32 h4 a3 3 0 0 1 0 4");
  path(group, "M48 24 c2 -4 6 -4 8 0");
  circle(group, 48, 40, 2.2);
  circle(group, 58, 40, 2.2);
}

function drawGym(group: SVGGElement): void {
  line(group, 10, 24, 62, 24);
  rect(group, 8, 16, 8, 16, 1);
  rect(group, 16, 18, 5, 12, 1);
  rect(group, 56, 16, 8, 16, 1);
  rect(group, 51, 18, 5, 12, 1);
  line(group, 8, 38, 64, 38);
}

function drawHome(group: SVGGElement): void {
  path(group, "M10 40 V20 L36 8 L62 20 V40 Z");
  rect(group, 32, 28, 8, 12, 0);
  rect(group, 16, 22, 8, 7, 0.5);
  rect(group, 48, 22, 8, 7, 0.5);
  line(group, 14, 18, 30, 18);
  path(group, "M16 18 v5 M22 18 v6 M28 18 v4");
}

function drawShop(group: SVGGElement): void {
  path(group, "M8 20 L16 12 H56 L64 20 Z");
  line(group, 20, 12, 16, 20);
  line(group, 32, 12, 28, 20);
  line(group, 44, 12, 40, 20);
  line(group, 56, 12, 52, 20);
  rect(group, 14, 20, 44, 18, 1);
  rect(group, 32, 26, 10, 12, 0);
  path(group, "M22 34 c4 -8 12 -8 16 0 c-2 6 -14 6 -16 0 Z");
  circle(group, 30, 30, 1.3);
  circle(group, 36, 29, 1.6);
  line(group, 24, 30, 22, 26);
  line(group, 36, 30, 38, 26);
}

function drawKebab(group: SVGGElement): void {
  rect(group, 8, 8, 28, 28, 2);
  line(group, 8, 22, 36, 22);
  path(group, "M44 18 c10 0 16 6 16 12 c0 8 -8 12 -16 12 c-6 0 -12 -4 -12 -10 c0 -8 6 -14 12 -14 Z");
  path(group, "M46 24 c6 2 10 6 10 10");
  path(group, "M50 14 c1 -4 4 -5 6 -2");
  path(group, "M56 12 c1 -4 4 -4 5 0");
}

function drawPark(group: SVGGElement): void {
  line(group, 18, 38, 18, 26);
  circle(group, 18, 18, 9);
  line(group, 52, 38, 52, 28);
  circle(group, 52, 22, 7);
  path(group, "M8 38 H64");
  path(group, "M26 38 v-6 h20 v6");
  path(group, "M34 32 h4");
  path(group, "M40 36 c2 -3 6 -2 6 1");
}

export function locationGlyph(id: LocationId): SVGSVGElement {
  switch (id) {
    case "pup":
      return canvas(drawPup);
    case "campus":
      return canvas(drawCampus);
    case "bank":
      return canvas(drawBank);
    case "cafe":
      return canvas(drawCafe);
    case "gym":
      return canvas(drawGym);
    case "home":
      return canvas(drawHome);
    case "shop":
      return canvas(drawShop);
    case "kebab":
      return canvas(drawKebab);
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function parkGlyph(): SVGSVGElement {
  return canvas(drawPark);
}

export function cityStamp(): SVGSVGElement {
  const svg = svgEl("svg");
  attr(svg, {
    viewBox: "0 0 40 40",
    class: "city-stamp",
    "aria-hidden": "true",
  });
  const group = strokeGroup();
  attr(group, { "stroke-width": 1.8 });
  circle(group, 20, 20, 16);
  path(group, "M8 24 H32");
  rect(group, 10, 16, 20, 8, 1);
  circle(group, 14, 28, 2.2);
  circle(group, 26, 28, 2.2);
  path(group, "M14 16 V12 H26 V16");
  svg.append(group);
  return svg;
}

export function meepleSvg(): SVGSVGElement {
  const svg = svgEl("svg");
  attr(svg, {
    viewBox: "0 0 20 24",
    class: "meeple",
    "aria-hidden": "true",
  });
  const body = svgEl("path");
  attr(body, {
    d: "M10 2.2 C7.2 2.2 5.2 4.3 5.2 6.7 C5.2 8.4 6.1 9.8 7.4 10.6 L4.4 20.2 H7.2 L8.1 14.6 V21.6 H11.9 V14.6 L12.8 20.2 H15.6 L12.6 10.6 C13.9 9.8 14.8 8.4 14.8 6.7 C14.8 4.3 12.8 2.2 10 2.2 Z",
    fill: "currentColor",
  });
  svg.append(body);
  return svg;
}
