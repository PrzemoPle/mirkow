import {
  avatarColor,
  boardEdges,
  costToLocation,
  getBotPlayer,
  getHumanPlayer,
  locationPreview,
  parkCell,
  travelPath,
  type GameState,
  type LocationId,
  type Player,
} from "../game";
import { t, type MessageKey } from "../i18n";
import { artImg, boardMatUrl, parkArtUrl, pawnArtUrl, tileArtUrl } from "./art";
import { el, svgEl } from "./dom";
import { interpolate } from "./format";
import { slide } from "./motion";

const EDGE_MS = 380;

export type Board = {
  root: HTMLElement;
  tiles: ReadonlyMap<LocationId, HTMLButtonElement>;
  syncTiles(state: GameState, player: Player, humanTurn: boolean): void;
  place(state: GameState): void;
  travel(who: "human" | "bot", state: GameState, from: LocationId, to: LocationId): Promise<void>;
  relayout(): void;
};

export function locationName(id: LocationId): MessageKey {
  const location = locationPreview.find((entry) => entry.id === id);
  if (location === undefined) {
    throw new Error(`Missing location copy for ${id}`);
  }
  return location.nameKey;
}

function pawnSize(board: HTMLElement): number {
  const raw = getComputedStyle(board).getPropertyValue("--pawn").trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
}

function tileCenter(tile: HTMLElement, board: HTMLElement): { x: number; y: number } {
  const tileBox = tile.getBoundingClientRect();
  const boardBox = board.getBoundingClientRect();
  return {
    x: tileBox.left - boardBox.left + tileBox.width / 2,
    y: tileBox.top - boardBox.top + tileBox.height / 2,
  };
}

function pawnTransform(tile: HTMLElement, board: HTMLElement, lane: number): string {
  const size = pawnSize(board);
  const center = tileCenter(tile, board);
  const x = center.x - size / 2 + lane * size * 0.5;
  const y = center.y - size * 0.62;
  return `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

function drawRoads(svg: SVGSVGElement, board: HTMLElement, tiles: ReadonlyMap<LocationId, HTMLElement>): void {
  const box = board.getBoundingClientRect();
  if (box.width === 0) {
    return;
  }
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.replaceChildren();

  const beds: SVGElement[] = [];
  const rails: SVGElement[] = [];
  for (const [from, to] of boardEdges) {
    const fromTile = tiles.get(from);
    const toTile = tiles.get(to);
    if (fromTile === undefined || toTile === undefined) {
      continue;
    }
    const a = tileCenter(fromTile, board);
    const b = tileCenter(toTile, board);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const ox = (-dy / length) * 2.6;
    const oy = (dx / length) * 2.6;

    const bed = svgEl("line");
    bed.setAttribute("x1", String(a.x));
    bed.setAttribute("y1", String(a.y));
    bed.setAttribute("x2", String(b.x));
    bed.setAttribute("y2", String(b.y));
    bed.setAttribute("class", "road-bed");
    beds.push(bed);

    for (const sign of [1, -1]) {
      const rail = svgEl("line");
      rail.setAttribute("x1", String(a.x + ox * sign));
      rail.setAttribute("y1", String(a.y + oy * sign));
      rail.setAttribute("x2", String(b.x + ox * sign));
      rail.setAttribute("y2", String(b.y + oy * sign));
      rail.setAttribute("class", "road-rail");
      rails.push(rail);
    }
    const tie = svgEl("line");
    tie.setAttribute("x1", String(a.x));
    tie.setAttribute("y1", String(a.y));
    tie.setAttribute("x2", String(b.x));
    tie.setAttribute("y2", String(b.y));
    tie.setAttribute("class", "road-tie");
    rails.push(tie);
  }
  svg.append(...beds, ...rails);
}

function buildPawn(className: string): { node: HTMLElement; tag: HTMLElement } {
  const node = el("span", className);
  node.setAttribute("aria-hidden", "true");
  node.hidden = true;
  const tag = el("span", "plaque pawn-tag");
  node.append(tag);
  return { node, tag };
}

function paintPawn(pawn: { node: HTMLElement; tag: HTMLElement }, player: Player): void {
  const src = pawnArtUrl(player.avatarId);
  if (pawn.node.dataset.src !== src) {
    pawn.node.dataset.src = src;
    const old = pawn.node.querySelector("img");
    old?.remove();
    pawn.node.prepend(artImg(src, ""));
  }
  pawn.tag.textContent = player.name;
  pawn.tag.style.background = player.controller === "bot" ? "" : avatarColor(player.avatarId);
  pawn.tag.style.color = player.controller === "bot" ? "" : "var(--paper)";
  pawn.node.hidden = false;
}

export function buildBoard(): Board {
  const root = el("section", "board");
  root.setAttribute("aria-label", t("cityName"));
  root.style.setProperty("--board-mat", `url("${boardMatUrl()}")`);

  const roads = svgEl("svg");
  roads.setAttribute("class", "roads");
  roads.setAttribute("aria-hidden", "true");
  root.append(roads);

  const tiles = new Map<LocationId, HTMLButtonElement>();
  for (const location of locationPreview) {
    const tile = el("button", "tile");
    tile.type = "button";
    tile.style.setProperty("--col", String(location.col));
    tile.style.setProperty("--row", String(location.row));
    tile.style.setProperty("--mcol", String(location.mobileCol));
    tile.style.setProperty("--mrow", String(location.mobileRow));
    tile.append(artImg(tileArtUrl(location.id), "tile-art", "tile"));
    const cost = el("span", "ticket tile-cost");
    const name = el("span", "plaque tile-name");
    name.textContent = t(location.nameKey);
    tile.append(cost, name);
    tiles.set(location.id, tile);
    root.append(tile);
  }

  const park = el("div", "tile tile-park");
  park.style.setProperty("--col", String(parkCell.col));
  park.style.setProperty("--row", String(parkCell.row));
  park.style.setProperty("--mcol", String(parkCell.mobileCol));
  park.style.setProperty("--mrow", String(parkCell.mobileRow));
  park.setAttribute("aria-hidden", "true");
  park.append(artImg(parkArtUrl(), "tile-art"));
  root.append(park);

  const human = buildPawn("pawn pawn-human");
  const bot = buildPawn("pawn pawn-bot");
  root.append(human.node, bot.node);

  function lanes(state: GameState): { human: number; bot: number } {
    const a = getHumanPlayer(state);
    const b = getBotPlayer(state);
    const shared = a !== undefined && b !== undefined && a.locationId === b.locationId;
    return shared ? { human: -0.7, bot: 0.7 } : { human: 0, bot: 0 };
  }

  function transformFor(id: LocationId, lane: number): string | null {
    const tile = tiles.get(id);
    if (tile === undefined) {
      return null;
    }
    return pawnTransform(tile, root, lane);
  }

  function place(state: GameState): void {
    const a = getHumanPlayer(state);
    const b = getBotPlayer(state);
    const lane = lanes(state);
    if (a !== undefined) {
      paintPawn(human, a);
      const transform = transformFor(a.locationId, lane.human);
      if (transform !== null) {
        human.node.style.transform = transform;
      }
    }
    if (b !== undefined) {
      paintPawn(bot, b);
      const transform = transformFor(b.locationId, lane.bot);
      if (transform !== null) {
        bot.node.style.transform = transform;
      }
    } else {
      bot.node.hidden = true;
    }
  }

  function relayout(): void {
    drawRoads(roads, root, tiles);
  }

  async function travel(
    who: "human" | "bot",
    state: GameState,
    from: LocationId,
    to: LocationId,
  ): Promise<void> {
    const pawn = who === "human" ? human : bot;
    const path = travelPath(from, to) ?? [from, to];
    const lane = lanes(state);
    const finalLane = who === "human" ? lane.human : lane.bot;
    let previous = transformFor(from, 0);
    for (let index = 1; index < path.length; index += 1) {
      const node = path[index];
      if (node === undefined) {
        continue;
      }
      const isLast = index === path.length - 1;
      const next = transformFor(node, isLast ? finalLane : 0);
      if (previous === null || next === null) {
        continue;
      }
      await slide(pawn.node, previous, next, EDGE_MS);
      previous = next;
    }
  }

  function syncTiles(state: GameState, player: Player, humanTurn: boolean): void {
    const rival = getBotPlayer(state);
    for (const [id, tile] of tiles) {
      const cost = costToLocation({ ...state, active: state.players.findIndex((p) => p.id === player.id) }, id);
      const costLabel = tile.querySelector(".tile-cost");
      const here = player.locationId === id;
      const botHere = rival?.locationId === id;
      const placeName = t(locationName(id));
      tile.classList.toggle("tile-here", here);
      tile.disabled = !humanTurn || here;
      if (here) {
        tile.setAttribute("aria-current", "location");
        tile.setAttribute("aria-label", `${placeName}, ${t("youAreHere")}`);
        tile.classList.remove("tile-blocked");
        if (costLabel instanceof HTMLElement) {
          costLabel.textContent = "";
          costLabel.className = "ticket tile-cost";
        }
        continue;
      }
      tile.removeAttribute("aria-current");
      if (cost === null) {
        tile.classList.remove("tile-blocked");
        tile.setAttribute("aria-label", placeName);
        if (costLabel instanceof HTMLElement) {
          costLabel.textContent = "";
        }
        continue;
      }
      const blocked = cost > state.timeLeft;
      const costText = interpolate("timeCost", { n: cost });
      tile.classList.toggle("tile-blocked", blocked && humanTurn);
      tile.setAttribute("aria-label", botHere === true ? `${placeName}, ${costText}, ${t("botOnTile")}` : `${placeName}, ${costText}`);
      if (costLabel instanceof HTMLElement) {
        costLabel.textContent = costText;
        costLabel.className = blocked && humanTurn ? "ticket ticket-void tile-cost" : "ticket tile-cost";
      }
    }
  }

  return { root, tiles, syncTiles, place, travel, relayout };
}
