// Generator wariantów graficznych dla Symulatora życia (Mirków).
// Jedna definicja sceny, trzy renderery stylu. Wyjście: SVG + HTML wrapper do rasteryzacji.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("./svg/", import.meta.url).pathname;

const PAL = {
  paper: "#E8DCC8", ink: "#2B2622", road: "#4A5560", park: "#7A8F6A",
  pup: "#C4B8A4", shop: "#E2B84A", kebab: "#D4652F", bank: "#3D6B8C",
  campus: "#6B4F7A", gym: "#3F7A6B", cafe: "#A45C4A", home: "#8B6B4A",
  skin: "#F1D3B6", hair: "#3A2A22",
};

// ---------- kolor ----------
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (r) => "#" + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));
const darken = (c, t) => mix(c, "#1A1410", t);
const lighten = (c, t) => mix(c, "#FFF6E6", t);

// ---------- prymitywy ----------
const R = (x, y, w, h, role, rx = 0) => ({ k: "rect", x, y, w, h, rx, role });
const C = (cx, cy, r, role) => ({ k: "circle", cx, cy, r, role });
const E = (cx, cy, rx, ry, role) => ({ k: "ellipse", cx, cy, rx, ry, role });
const P = (d, role) => ({ k: "path", d, role });
const L = (d, role, w) => ({ k: "line", d, role, w }); // stroke only

// ---------- sceny kafelków (512×384, motyw w górnych 68%) ----------
function sceneKebab() {
  const s = [];
  s.push(R(0, 250, 512, 134, "ground"));
  s.push(R(0, 250, 512, 10, "groundEdge"));
  // kiosk
  s.push(R(56, 100, 400, 156, "base", 4));
  s.push(R(56, 222, 400, 34, "baseDark"));
  s.push(P("M40 100 H472 L456 62 H56 Z", "baseDark"));
  // gołąb na dachu
  s.push(E(392, 54, 16, 10, "ink"));
  s.push(C(406, 46, 6, "ink"));
  s.push(L("M412 46 l6 2", "inkStroke", 3));
  s.push(L("M388 64 v6 M396 64 v6", "inkStroke", 3));
  // falbana markizy
  for (let i = 0; i < 10; i++) s.push(P(`M${56 + i * 40} 100 l20 14 l20 -14 Z`, i % 2 ? "paper" : "baseDark"));
  // okienko
  s.push(R(160, 122, 150, 94, "ink", 4));
  s.push(R(160, 200, 150, 16, "baseLight"));
  // rożen w oknie
  s.push(L("M236 128 V198", "paperStroke", 5));
  s.push(P("M208 136 H264 L252 192 H220 Z", "base"));
  s.push(P("M212 152 H260 M215 168 H257 M218 182 H254", "baseDarkStroke"));
  // lampa
  s.push(R(124, 100, 4, 14, "ink"));
  s.push(C(126, 126, 12, "paper"));
  // drzwi
  s.push(R(380, 148, 52, 108, "baseDark", 2));
  s.push(C(420, 206, 4, "paper"));
  // para
  s.push(L("M292 116 c-16 -14 16 -30 0 -44 c-16 -14 16 -30 0 -44", "paperStroke", 9));
  s.push(L("M322 122 c-12 -12 12 -24 0 -36 c-12 -12 12 -24 0 -36", "paperStroke", 7));
  // skrzynka
  s.push(R(68, 226, 44, 30, "baseLight", 2));
  s.push(L("M68 241 H112", "inkStroke", 3));
  return s;
}

function sceneHome() {
  const s = [];
  s.push(R(0, 250, 512, 134, "ground"));
  s.push(R(0, 250, 512, 10, "groundEdge"));
  s.push(R(40, 24, 432, 232, "base"));
  s.push(R(24, 24, 464, 18, "baseDark"));
  s.push(R(40, 42, 432, 8, "baseLight"));
  s.push(R(50, 50, 10, 206, "baseDark")); // rynna
  const cols = [96, 218, 340];
  const rows = [66, 164];
  for (const y of rows) for (const x of cols) {
    const lit = x === 218 && y === 66;
    s.push(R(x - 6, y + 72, 88, 8, "baseLight")); // parapet
    s.push(R(x, y, 76, 72, lit ? "warm" : "ink", 2));
    if (lit) {
      s.push(P(`M${x} ${y} h24 v72 h-24 Z`, "baseLight"));
      s.push(P(`M${x + 52} ${y} h24 v72 h-24 Z`, "baseLight"));
      // kot na parapecie (sylwetka)
      s.push(E(x + 38, y + 60, 20, 11, "ink"));
      s.push(C(x + 54, y + 50, 9, "ink"));
      s.push(P(`M${x + 48} ${y + 44} l2 -8 l5 6 Z M${x + 56} ${y + 42} l3 -8 l4 8 Z`, "ink"));
      s.push(L(`M${x + 20} ${y + 64} c-8 -2 -10 -12 -4 -16`, "inkStroke", 4));
    }
    s.push(L(`M${x + 38} ${y} V${y + 72} M${x} ${y + 36} H${x + 76}`, "paperStroke", 4));
  }
  // sznur z praniem
  s.push(L("M40 122 Q256 158 472 126", "inkStroke", 3));
  const laundry = [[88, 134, 36, 44, "paper"], [150, 141, 44, 40, "cloth"], [212, 148, 34, 56, "baseLight"], [280, 147, 42, 42, "paper"], [346, 141, 36, 48, "cloth"], [408, 132, 40, 36, "paper"]];
  for (const [x, y, w, h, role] of laundry) {
    s.push(R(x, y, w, h, role, 3));
    s.push(R(x + 3, y - 4, 5, 10, "ink", 1));
    s.push(R(x + w - 8, y - 4, 5, 10, "ink", 1));
  }
  return s;
}

function sceneShop() {
  const s = [];
  s.push(R(0, 250, 512, 134, "ground"));
  s.push(R(0, 250, 512, 10, "groundEdge"));
  s.push(R(32, 60, 448, 196, "base"));
  s.push(R(32, 60, 448, 56, "baseDark")); // szyld
  // żuk (znak)
  s.push(C(256, 76, 8, "ink"));
  s.push(L("M250 70 l-8 -8 M262 70 l8 -8", "inkStroke", 3));
  s.push(E(256, 96, 24, 17, "ink"));
  s.push(L("M256 82 V112", "paperStroke", 3));
  s.push(C(246, 92, 3.5, "paper")); s.push(C(266, 92, 3.5, "paper"));
  s.push(C(248, 103, 3, "paper")); s.push(C(264, 103, 3, "paper"));
  s.push(L("M236 90 l-12 -4 M236 100 l-12 4 M276 90 l12 -4 M276 100 l12 4", "inkStroke", 3));
  // markiza w pasy
  const n = 12, top = [24, 488], bot = [8, 504];
  for (let i = 0; i < n; i++) {
    const tx0 = top[0] + (top[1] - top[0]) * (i / n), tx1 = top[0] + (top[1] - top[0]) * ((i + 1) / n);
    const bx0 = bot[0] + (bot[1] - bot[0]) * (i / n), bx1 = bot[0] + (bot[1] - bot[0]) * ((i + 1) / n);
    s.push(P(`M${tx0} 116 H${tx1} L${bx1} 158 H${bx0} Z`, i % 2 ? "paper" : "baseDark"));
  }
  for (let i = 0; i < n; i++) {
    const bx0 = bot[0] + (bot[1] - bot[0]) * (i / n), bx1 = bot[0] + (bot[1] - bot[0]) * ((i + 1) / n);
    s.push(P(`M${bx0} 158 a${(bx1 - bx0) / 2} 9 0 0 0 ${bx1 - bx0} 0 Z`, i % 2 ? "paper" : "baseDark"));
  }
  s.push(R(32, 164, 448, 8, "shade"));
  // witryny i drzwi
  s.push(R(56, 176, 136, 80, "glass", 2));
  s.push(R(320, 176, 136, 80, "glass", 2));
  s.push(R(212, 176, 88, 80, "ink", 2));
  s.push(R(214, 178, 84, 76, "glass2", 1));
  s.push(R(252, 214, 8, 20, "ink", 2));
  // towar w witrynach
  for (const [x, y, w, h] of [[84, 204, 30, 24], [118, 196, 34, 32], [156, 208, 26, 20], [332, 200, 32, 28], [368, 210, 28, 18], [400, 196, 30, 32]]) s.push(R(x, y, w, h, "baseDark", 2));
  // wózek
  s.push(P("M396 196 H454 L446 236 H404 Z", "inkStroke4"));
  s.push(L("M454 196 l10 -16 h12", "inkStroke", 4));
  s.push(L("M406 208 H448 M404 220 H446", "inkStroke", 3));
  s.push(C(410, 246, 6, "ink")); s.push(C(444, 246, 6, "ink"));
  return s;
}

// ---------- awatar Ola (512×512) ----------
function sceneAvatarOla() {
  const s = [];
  s.push(C(256, 256, 256, "avatarBg"));
  s.push(P("M92 520 C96 404 150 350 256 350 C362 350 416 404 420 520 Z", "token"));
  s.push(P("M232 350 L256 384 L280 350 Z", "paper"));
  s.push(R(226, 286, 60, 84, "skin", 20));
  s.push(E(256, 222, 92, 104, "skin"));
  s.push(P("M164 236 C156 116 200 92 256 92 C312 92 356 116 348 236 C346 196 322 168 256 168 C190 168 166 196 164 236 Z", "hair"));
  s.push(R(160, 200, 34, 96, "hair", 14));
  s.push(R(318, 200, 34, 96, "hair", 14));
  s.push(L("M212 210 q12 -8 26 -2 M274 208 q14 -6 26 2", "inkStroke", 6));
  s.push(C(222, 236, 26, "glass"));
  s.push(C(290, 236, 26, "glass"));
  s.push(L("M248 236 H264 M196 232 L176 226 M316 232 L336 226", "inkStroke", 6));
  s.push(C(222, 236, 26, "ringStroke"));
  s.push(C(290, 236, 26, "ringStroke"));
  s.push(C(224, 238, 5, "ink")); s.push(C(292, 238, 5, "ink"));
  s.push(L("M240 290 Q256 300 272 290", "inkStroke", 6));
  return s;
}

// ---------- pionek Ola (256×256, alfa) ----------
function scenePawnOla() {
  const s = [];
  s.push(P("M96 104 C58 122 46 168 36 228 L94 228 L102 176 L102 232 L154 232 L154 176 L162 228 L220 228 C210 168 198 122 160 104 Z", "token"));
  s.push(C(128, 74, 38, "skin"));
  s.push(P("M90 72 C90 36 108 26 128 26 C148 26 166 36 166 72 C158 56 146 50 128 50 C110 50 98 56 90 72 Z", "hair"));
  s.push(R(88, 62, 14, 40, "hair", 6));
  s.push(R(154, 62, 14, 40, "hair", 6));
  s.push(C(116, 80, 9, "ringStroke")); s.push(C(140, 80, 9, "ringStroke"));
  s.push(L("M125 80 H131", "inkStroke", 3));
  return s;
}

// ---------- renderery ----------
function roleColor(role, base, textOnDark, style) {
  const P0 = PAL.paper, INK = PAL.ink;
  const soft = style === "wycinanka" ? (c) => mix(c, P0, 0.1) : (c) => c;
  switch (role) {
    case "ground": return soft(textOnDark ? darken(base, 0.42) : lighten(base, 0.45));
    case "groundEdge": return soft(textOnDark ? darken(base, 0.55) : lighten(base, 0.2));
    case "base": return soft(base);
    case "baseDark": return soft(darken(base, 0.38));
    case "baseLight": return soft(lighten(base, 0.5));
    case "warm": return "#F6E3A8";
    case "cloth": return soft(PAL.gym);
    case "token": return soft(base);
    case "shade": return darken(base, 0.55);
    case "glass": return mix(PAL.bank, P0, 0.72);
    case "glass2": return mix(PAL.bank, P0, 0.55);
    case "ink": return INK;
    case "paper": return lighten(P0, 0.5);
    case "skin": return soft(PAL.skin);
    case "hair": return PAL.hair;
    case "avatarBg": return mix(base, P0, 0.58);
    default: return "#FF00FF";
  }
}

function shapeEl(sh, fill, stroke, extra = "") {
  const st = stroke ? ` stroke="${stroke.c}" stroke-width="${stroke.w}" stroke-linejoin="round" stroke-linecap="round"` : "";
  switch (sh.k) {
    case "rect": return `<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" rx="${sh.rx}" fill="${fill}"${st}${extra}/>`;
    case "circle": return `<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" fill="${fill}"${st}${extra}/>`;
    case "ellipse": return `<ellipse cx="${sh.cx}" cy="${sh.cy}" rx="${sh.rx}" ry="${sh.ry}" fill="${fill}"${st}${extra}/>`;
    case "path": return `<path d="${sh.d}" fill="${fill}"${st}${extra}/>`;
    case "line": return `<path d="${sh.d}" fill="none"${st}${extra}/>`;
  }
}

const isStrokeRole = (r) => /Stroke/.test(r);
function strokeSpec(role, base, style, textOnDark) {
  const INK = PAL.ink;
  const w = style === "linoryt" ? 1.25 : style === "halftone" ? 0.9 : 1;
  if (role === "paperStroke") return { c: lighten(PAL.paper, 0.5), w: 6 * w };
  if (role === "inkStroke") return { c: INK, w: 4 * w };
  if (role === "inkStroke4") return { c: INK, w: 5 * w };
  if (role === "baseDarkStroke") return { c: darken(base, 0.45), w: 4 * w };
  if (role === "ringStroke") return { c: INK, w: 5 * w };
  return null;
}

function defs(style, base, uid) {
  const INK = PAL.ink, P0 = PAL.paper;
  let d = "";
  d += `<filter id="grain${uid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.55" intercept="-0.1"/></feComponentTransfer></filter>`;
  d += `<filter id="fiber${uid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="3" seed="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.4" intercept="-0.05"/></feComponentTransfer></filter>`;
  d += `<filter id="shadow${uid}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="1.6" flood-color="${INK}" flood-opacity="0.28"/></filter>`;
  d += `<filter id="wobble${uid}"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  // rastry halftone
  d += `<pattern id="dotsInk${uid}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="2.4" fill="${INK}" fill-opacity="0.55"/></pattern>`;
  d += `<pattern id="dotsPaper${uid}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="2.6" fill="${lighten(P0, 0.6)}" fill-opacity="0.85"/></pattern>`;
  d += `<pattern id="dotsSoft${uid}" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="5.5" cy="5.5" r="1.6" fill="${INK}" fill-opacity="0.35"/></pattern>`;
  return d;
}

function render(shapes, { w, h, style, base, textOnDark, opaque, uid }) {
  const INK = PAL.ink;
  const body = [];
  const fillOf = (sh) => roleColor(sh.role, base, textOnDark, style);

  if (style === "linoryt") {
    // wypełnienia lekko przesunięte (misregistracja), potem kreska tuszem
    const fills = [], lines = [];
    for (const sh of shapes) {
      if (isStrokeRole(sh.role)) { lines.push(shapeEl(sh, "none", strokeSpec(sh.role, base, style))); continue; }
      fills.push(shapeEl(sh, fillOf(sh), null));
      if (["ground", "groundEdge", "avatarBg", "shade"].includes(sh.role)) continue;
      lines.push(shapeEl(sh, "none", { c: INK, w: 5 }));
    }
    body.push(`<g transform="translate(3 2)">${fills.join("")}</g>`);
    body.push(`<g filter="url(#wobble${uid})">${lines.join("")}</g>`);
    body.push(`<rect width="${w}" height="${h}" filter="url(#grain${uid})" opacity="0.5" style="mix-blend-mode:multiply"/>`);
  }

  if (style === "wycinanka") {
    for (const sh of shapes) {
      if (isStrokeRole(sh.role)) { body.push(shapeEl(sh, "none", strokeSpec(sh.role, base, style))); continue; }
      const flat = ["ground", "groundEdge", "avatarBg"].includes(sh.role);
      body.push(shapeEl(sh, fillOf(sh), null, flat ? "" : ` filter="url(#shadow${uid})"`));
    }
    body.push(`<rect width="${w}" height="${h}" filter="url(#fiber${uid})" opacity="0.35" style="mix-blend-mode:multiply"/>`);
  }

  if (style === "halftone") {
    for (const sh of shapes) {
      if (isStrokeRole(sh.role)) { body.push(shapeEl(sh, "none", strokeSpec(sh.role, base, style))); continue; }
      const thin = ["ground", "groundEdge", "avatarBg", "shade"].includes(sh.role) ? null : { c: INK, w: 2.4 };
      if (sh.role === "hair") {
        body.push(shapeEl(sh, PAL.hair, thin));
      } else if (sh.role === "baseDark" || sh.role === "shade") {
        body.push(shapeEl(sh, roleColor("base", base, textOnDark, style), null));
        body.push(shapeEl(sh, `url(#dotsInk${uid})`, thin));
      } else if (sh.role === "baseLight" || sh.role === "glass" || sh.role === "warm") {
        body.push(shapeEl(sh, roleColor("base", base, textOnDark, style), null));
        body.push(shapeEl(sh, `url(#dotsPaper${uid})`, thin));
      } else if (sh.role === "ground") {
        body.push(shapeEl(sh, roleColor(textOnDark ? "baseDark" : "baseLight", base, textOnDark, style), null));
        body.push(shapeEl(sh, `url(#dotsSoft${uid})`, null));
      } else {
        body.push(shapeEl(sh, fillOf(sh), thin));
      }
    }
    body.push(`<rect width="${w}" height="${h}" filter="url(#grain${uid})" opacity="0.3" style="mix-blend-mode:multiply"/>`);
  }

  const bg = opaque ? `<rect width="${w}" height="${h}" fill="${style === "wycinanka" ? lighten(PAL.paper, 0.15) : PAL.paper}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs(style, base, uid)}</defs>${bg}${body.join("")}</svg>`;
}

// ---------- zestaw ----------
const STYLES = ["linoryt", "wycinanka", "halftone"];
const ITEMS = [
  { name: "tiles-kebab", scene: sceneKebab, w: 512, h: 384, base: PAL.kebab, textOnDark: true, opaque: true },
  { name: "tiles-home", scene: sceneHome, w: 512, h: 384, base: PAL.home, textOnDark: true, opaque: true },
  { name: "tiles-shop", scene: sceneShop, w: 512, h: 384, base: PAL.shop, textOnDark: false, opaque: true },
  { name: "avatars-ola", scene: sceneAvatarOla, w: 512, h: 512, base: PAL.kebab, textOnDark: false, opaque: false },
  { name: "pawns-ola", scene: scenePawnOla, w: 256, h: 256, base: PAL.kebab, textOnDark: false, opaque: false },
];

let uid = 0;
for (const style of STYLES) {
  mkdirSync(join(OUT, style), { recursive: true });
  for (const it of ITEMS) {
    uid++;
    const svg = render(it.scene(), { ...it, style, uid });
    writeFileSync(join(OUT, style, it.name + ".svg"), svg);
    writeFileSync(join(OUT, style, it.name + ".html"), `<html><body style="margin:0;background:transparent"><img src="${it.name}.svg" width="${it.w}" height="${it.h}"></body></html>`);
  }
}
console.log("ok", STYLES.length * ITEMS.length, "svg");
