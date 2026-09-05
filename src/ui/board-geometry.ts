import { boardEdges } from "../game/board";
import type { LocationId } from "../game/catalog";
import { svgEl } from "./dom";

export const PAWN_SIZE = 36;

export function tileCenter(
  tile: HTMLElement,
  board: HTMLElement,
): { x: number; y: number } {
  const tileBox = tile.getBoundingClientRect();
  const boardBox = board.getBoundingClientRect();
  return {
    x: tileBox.left - boardBox.left + tileBox.width / 2,
    y: tileBox.top - boardBox.top + tileBox.height / 2,
  };
}

export function pawnTransform(
  tile: HTMLElement,
  board: HTMLElement,
  lane = 0,
): string {
  const tileBox = tile.getBoundingClientRect();
  const boardBox = board.getBoundingClientRect();
  const x =
    tileBox.left -
    boardBox.left +
    (tileBox.width - PAWN_SIZE) / 2 +
    lane * (PAWN_SIZE * 0.55);
  const y = tileBox.top - boardBox.top + tileBox.height * 0.22;
  return `translate(${x}px, ${y}px)`;
}

export function drawRoads(
  svg: SVGSVGElement,
  board: HTMLElement,
  tiles: ReadonlyMap<LocationId, HTMLElement>,
): void {
  const box = board.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.replaceChildren();

  for (const [from, to] of boardEdges) {
    const fromTile = tiles.get(from);
    const toTile = tiles.get(to);
    if (fromTile === undefined || toTile === undefined) {
      continue;
    }
    const start = tileCenter(fromTile, board);
    const end = tileCenter(toTile, board);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const ox = (-dy / length) * 3;
    const oy = (dx / length) * 3;

    const railA = svgEl("line");
    railA.setAttribute("x1", String(start.x + ox));
    railA.setAttribute("y1", String(start.y + oy));
    railA.setAttribute("x2", String(end.x + ox));
    railA.setAttribute("y2", String(end.y + oy));
    railA.setAttribute("class", "road-rail");

    const railB = svgEl("line");
    railB.setAttribute("x1", String(start.x - ox));
    railB.setAttribute("y1", String(start.y - oy));
    railB.setAttribute("x2", String(end.x - ox));
    railB.setAttribute("y2", String(end.y - oy));
    railB.setAttribute("class", "road-rail");

    const dash = svgEl("line");
    dash.setAttribute("x1", String(start.x));
    dash.setAttribute("y1", String(start.y));
    dash.setAttribute("x2", String(end.x));
    dash.setAttribute("y2", String(end.y));
    dash.setAttribute("class", "road-dash");

    svg.append(railA, railB, dash);
  }
}
