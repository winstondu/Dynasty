const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require(path.join(process.env.PPTX_SKILL, "scripts/apply_theme.js"));
const N = require("./notes");

const OUT = process.argv[2] || "Dynasty.pptx";

// Palette and type from the WorkerClaude reference deck.
const K = {
  cream: "F0EEE6", paper: "FBFAF6", ink: "141413", gray: "5E5B54", dim: "8A867C",
  terra: "D97757", yellow: "E8C547", ochre: "7A5A10", green: "2F7D4F", red: "B5432B",
  border: "DDD9CE", grid: "C5C4BF", zebra: "F7F5EF", codeDark: "262522", darkBody: "BFBBB0",
  charcoal: "4B4B48",
};
const HEAD = "Source Serif 4", BODY = "DM Sans", MONO = "Courier New";
const THEME = {
  name: "DyLib Cream",
  headFontFace: HEAD, bodyFontFace: BODY,
  colors: {
    dk1: K.ink, lt1: K.cream, dk2: K.charcoal, lt2: "DAD8D1",
    accent1: K.terra, accent2: K.ochre, accent3: K.yellow, accent4: K.gray, accent5: K.dim, accent6: K.darkBody,
    hlink: K.terra, folHlink: K.ochre,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
pres.title = "Dynasty: lazy, type-safe plugins for Swift";
pres.author = "Winston Du";

const M = 0.89, CW = 11.56, R = M + CW;

// ---------- layouts ----------
const eyebrowPh = (y) => ({ placeholder: { options: { name: "eyebrow", type: "body", x: M, y, w: 11.9, h: 0.28, fontFace: BODY, fontSize: 13, bold: true, color: K.terra, charSpacing: 1, margin: 0, valign: "top" }, text: "" } });
const titlePh = (y, size, color, h) => ({ placeholder: { options: { name: "title", type: "title", x: M, y, w: 11.9, h, align: "left", fontFace: HEAD, fontSize: size, color, margin: 0, valign: "top", lineSpacingMultiple: 1.1 }, text: "" } });
const slideNum = { x: M, y: 6.82, w: 0.6, h: 0.26, fontFace: BODY, fontSize: 12, color: K.dim, margin: 0 };

pres.defineSlideMaster({
  title: "Title", background: { color: K.cream },
  objects: [
    { placeholder: { options: { name: "eyebrow", type: "body", x: M, y: 2.2, w: 5.9, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: K.terra, charSpacing: 1, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.7, w: 5.9, h: 1.5, align: "left", fontFace: HEAD, fontSize: 46, color: K.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.05 }, text: "" } },
    { placeholder: { options: { name: "sub", type: "body", x: M, y: 4.4, w: 5.6, h: 1.0, fontFace: BODY, fontSize: 17, color: K.gray, margin: 0, valign: "top" }, text: "" } },
  ],
});
for (const [name, bg] of [["Content Cream", K.cream], ["Content Paper", K.paper]]) {
  pres.defineSlideMaster({
    title: name, background: { color: bg },
    objects: [eyebrowPh(0.89), titlePh(1.22, 36, K.ink, 0.62)],
    slideNumber: slideNum,
  });
}
pres.defineSlideMaster({
  title: "Closing", background: { color: K.ink },
  objects: [
    { placeholder: { options: { name: "eyebrow", type: "body", x: M, y: 1.16, w: 7.2, h: 0.28, fontFace: BODY, fontSize: 13, bold: true, color: K.terra, charSpacing: 1, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.6, w: 7.4, h: 1.4, align: "left", fontFace: HEAD, fontSize: 42, color: K.cream, margin: 0, valign: "top", lineSpacingMultiple: 1.05 }, text: "" } },
  ],
});

// ---------- helpers ----------
let section = null;
function newSlide(layout, eyebrow, title, notes) {
  const s = pres.addSlide({ masterName: layout, sectionTitle: section });
  if (eyebrow) s.addText(eyebrow.toUpperCase(), { placeholder: "eyebrow" });
  if (title) s.addText(title, { placeholder: "title" });
  if (notes) s.addNotes(notes);
  return s;
}
function addSection(title) { section = title; pres.addSection({ title }); }

function text(s, str, o) {
  s.addText(str, { isTextBox: true, margin: 0, valign: "top", fontFace: BODY, color: K.ink, ...o });
}
function card(s, x, y, w, h, title, desc, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: o.fill || K.paper }, line: { color: o.border || K.border, width: o.borderW || 0.5, dashType: o.dash || "solid" }, objectName: o.name });
  let ty = y + 0.22;
  if (o.kicker) { text(s, o.kicker, { x: x + 0.28, y: ty, w: w - 0.56, h: 0.5, fontFace: o.kickerFont || HEAD, fontSize: o.kickerSize || 28, color: K.terra }); ty += o.kickerH || 0.6; }
  text(s, title, { x: x + 0.28, y: ty, w: w - 0.56, h: 0.32, fontSize: o.titleSize || 16, bold: true, color: o.titleColor || K.ink });
  if (desc) text(s, desc, { x: x + 0.28, y: ty + (o.descGap || 0.38), w: w - 0.56, h: h - (ty - y) - 0.5, fontSize: o.descSize || 13, color: K.gray, lineSpacingMultiple: 1.15, fontFace: o.descFont || BODY });
}
function punch(s, str, y, o = {}) {
  text(s, str, { x: M, y, w: CW, h: 0.4, fontSize: 17, bold: true, color: K.terra, ...o });
}

// Minimal Swift highlighter: macros, keywords, strings, comments.
const KW = new Set("import public struct enum func let var static return try protocol init class override private guard do catch throw self any some if else as".split(" "));
function swiftRuns(code, dark) {
  const c = dark
    ? { base: K.cream, macro: K.terra, kw: K.yellow, str: "A8C89A", com: K.dim }
    : { base: K.ink, macro: K.terra, kw: K.ochre, str: K.green, com: K.dim };
  const runs = [];
  const lines = code.split("\n");
  lines.forEach((line, li) => {
    const tokRe = /(\/\/.*$)|("(?:[^"\\]|\\\([^)]*\)\)?|\\.)*")|(@\w+|#\w+)|([A-Za-z_]\w*)|(\s+)|(.)/g;
    let m, buf = "", bufColor = c.base, bufBold = false;
    const flush = () => { if (buf) runs.push({ text: buf, options: { color: bufColor, bold: bufBold } }); buf = ""; };
    const push = (t, color, bold = false) => {
      if (color !== bufColor || bold !== bufBold) { flush(); bufColor = color; bufBold = bold; }
      buf += t;
    };
    while ((m = tokRe.exec(line)) !== null) {
      if (m[1]) push(m[1], c.com);
      else if (m[2]) push(m[2], c.str);
      else if (m[3]) push(m[3], c.macro, true);
      else if (m[4]) push(m[4], KW.has(m[4]) ? c.kw : c.base, false);
      else push(m[0], c.base);
    }
    if (!line.length) push(" ", c.base);
    flush();
    if (li < lines.length - 1) runs[runs.length - 1].options.breakLine = true;
  });
  return runs;
}
function codePanel(s, x, y, w, h, label, code, o = {}) {
  const dark = !!o.dark;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: o.fill || (dark ? K.codeDark : K.cream) }, line: o.border ? { color: K.border, width: 0.5 } : { color: o.fill || (dark ? K.codeDark : K.cream), width: 0 } });
  let cy = y + 0.2;
  if (label) {
    text(s, label.toUpperCase(), { x: x + 0.28, y: cy, w: w - 0.56, h: 0.24, fontSize: 11, bold: true, charSpacing: 0.5, color: dark ? K.dim : K.gray });
    cy += 0.36;
  }
  const runs = o.plain ? [{ text: code, options: { color: o.color || (dark ? K.cream : K.ink) } }] : swiftRuns(code, dark);
  s.addText(runs, { isTextBox: true, x: x + 0.28, y: cy, w: w - 0.5, h: y + h - cy - 0.15, margin: 0, valign: "top", fontFace: MONO, fontSize: o.size || 13, lineSpacingMultiple: 1.05 });
  if (o.note) text(s, o.note, { x: x + 0.28, y: y + h - 0.42, w: w - 0.56, h: 0.3, fontSize: 12, color: K.gray });
}
function box(s, x, y, w, h, title, sub, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: o.fill || K.paper }, line: { color: o.border || K.ink, width: o.bw || 1, dashType: o.dash || "solid" } });
  text(s, title, { x: x + 0.16, y: y + 0.12, w: w - 0.3, h: 0.28, fontSize: o.titleSize || 13, bold: true });
  if (sub) text(s, sub, { x: x + 0.16, y: y + 0.44, w: w - 0.3, h: h - 0.5, fontFace: o.subFont || MONO, fontSize: o.subSize || 11, color: o.subColor || K.gray });
}
function arrowDown(s, x, y1, y2, color = K.terra, dash = "dash") {
  s.addShape(pres.shapes.LINE, { x, y: y1, w: 0, h: y2 - y1, line: { color, width: 1.75, dashType: dash, endArrowType: "triangle" } });
}
function arrowRight(s, x1, x2, y, color = K.terra, dash = "dash") {
  s.addShape(pres.shapes.LINE, { x: x1, y, w: x2 - x1, h: 0, line: { color, width: 1.75, dashType: dash, endArrowType: "triangle" } });
}
function stepArrow(s, x, y) {
  s.addShape(pres.shapes.RIGHT_ARROW, { x, y, w: 0.34, h: 0.24, fill: { color: K.terra }, line: { color: K.terra, width: 0 } });
}
function table(s, rows, o) {
  const hdr = rows[0].map((t, i) => ({ text: t, options: { bold: true, color: (o.hdrColors && o.hdrColors[i]) || K.gray, fill: { color: o.hdrFill || K.cream } } }));
  const body = rows.slice(1).map((r, ri) => r.map((cell, ci) => {
    const base = typeof cell === "string" ? { text: cell, options: {} } : cell;
    const colFont = o.colFont && o.colFont[ci];
    return { text: base.text, options: { fill: ri % 2 === 0 ? { color: o.zebra || K.zebra } : undefined, fontFace: colFont || BODY, color: (o.colColor && o.colColor[ci]) || K.ink, ...(colFont ? { fontSize: o.monoSize || 12 } : {}), ...base.options } };
  }));
  s.addTable([hdr, ...body], {
    x: o.x ?? M, y: o.y, w: o.w ?? CW, colW: o.colW, fontFace: BODY, fontSize: o.size || 14, color: K.ink, valign: "middle",
    margin: [0.1, 0.17, 0.1, 0.17], rowH: o.rowH,
    border: [{ type: "none" }, { type: "none" }, { pt: 1, color: K.grid }, { type: "none" }],
  });
}

// Bundle illustration: app executable, embedded plugins (dashed), linked interfaces (solid).
function bundleMini(s, x, y, w, h) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color: K.paper }, line: { color: K.border, width: 0.75 } });
  text(s, "YourApp.app", { x: x + 0.25, y: y + 0.18, w: 3, h: 0.3, fontSize: 14, bold: true });
  const iw = w - 0.5, ix = x + 0.25;
  box(s, ix, y + 0.6, iw, 0.55, "App executable", null, { fill: K.cream });
  text(s, "imports protocols only", { x: ix + 2.0, y: y + 0.72, w: iw - 2.2, h: 0.3, fontSize: 12, color: K.gray, align: "right" });
  const pw = (iw - 0.4) / 3, py = y + 1.65;
  ["Cat", "Mouse", "Dog"].forEach((n, i) => {
    const bx = ix + i * (pw + 0.2);
    arrowDown(s, bx + pw / 2, y + 1.15, py);
    box(s, bx, py, pw, 0.7, n, ".framework", { border: K.terra, dash: "dash", bw: 1.25 });
  });
  text(s, "embedded · dlopen on first use", { x: ix, y: py + 0.78, w: iw, h: 0.26, fontSize: 12, bold: true, color: K.terra });
  const ly = py + 1.25;
  ["Interfaces", "Logging", "Runtime"].forEach((n, i) => {
    box(s, ix + i * (pw + 0.2), ly, pw, 0.5, n, null, { fill: K.cream, border: K.charcoal });
  });
  text(s, "linked · loaded before main()", { x: ix, y: ly + 0.58, w: iw, h: 0.26, fontSize: 12, bold: true, color: K.charcoal });
}

// ================= slides =================

// 1. Title
addSection("Problem");
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: section });
  s.addText("DYNASTY", { placeholder: "eyebrow" });
  s.addText("Linked by nobody, loaded on first use", { placeholder: "title" });
  s.addText("Type-safe Swift plugins: three macros generate the wiring, the compiler checks it, and an optional logger times every lazy load.", { placeholder: "sub" });
  bundleMini(s, 7.15, 1.75, 5.3, 4.15);
  s.addNotes(N.title);
}

// Launch timeline in a cream panel; block offsets are in a 3.08"-wide frame, scaled to fit.
function timelinePanel(s, x, y, w, h, title, desc, blocks, fill = K.cream) {
  const k = (w - 0.6) / 3.08, px = x + 0.3, ly = y + h * 0.58, main = px + 1.55 * k;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: fill === K.cream ? K.cream : K.border, width: fill === K.cream ? 0 : 0.5 } });
  text(s, title, { x: px, y: y + 0.25, w: w - 0.6, h: 0.32, fontSize: 16, bold: true });
  s.addShape(pres.shapes.LINE, { x: px, y: ly, w: w - 0.6, h: 0, line: { color: K.dim, width: 1 } });
  s.addShape(pres.shapes.LINE, { x: main, y: ly - 0.65, w: 0, h: 0.85, line: { color: K.ink, width: 1, dashType: "dash" } });
  blocks.forEach(([a, b, col, lab]) => {
    s.addShape(pres.shapes.RECTANGLE, { x: px + a * k, y: ly - 0.42, w: (b - a) * k, h: 0.34, fill: { color: col }, line: { color: col, width: 0 } });
    text(s, lab, { x: px + a * k, y: ly - 0.42, w: (b - a) * k, h: 0.34, fontSize: 11, bold: true, color: K.paper, align: "center", valign: "middle" });
  });
  text(s, "launch", { x: px, y: ly + 0.1, w: 1, h: 0.24, fontSize: 11, color: K.gray });
  text(s, "main()", { x: main - 0.5, y: ly + 0.1, w: 1, h: 0.24, fontFace: MONO, fontSize: 11, color: K.ink, align: "center" });
  text(s, "first use", { x: x + w - 1.38, y: ly + 0.1, w: 1.08, h: 0.24, fontSize: 11, color: K.gray, align: "right" });
  text(s, desc, { x: px, y: ly + 0.5, w: w - 0.6, h: y + h - ly - 0.6, fontSize: 14, color: K.gray });
}

// 2. Linking: both pay before main()
{
  const s = newSlide("Content Paper", "The problem", "Everything you link is paid for before main()", N.problem);
  const w = (CW - 0.3) / 2, y = 2.35, h = 3.35;
  timelinePanel(s, M, y, w, h, "Static linking", "The feature’s code is copied into the executable, so it loads with the app.", [[0.1, 1.4, K.charcoal, "app + feature"]]);
  timelinePanel(s, M + w + 0.3, y, w, h, "Dynamic linking", "A load command makes dyld map, rebase and bind the framework before main(), on every launch.", [[0.1, 0.7, K.charcoal, "app"], [0.75, 1.4, K.terra, "dyld"]]);
  punch(s, "Every linked feature costs launch time for every user, whether this session touches it or not.", 6.0, { h: 0.5 });
}

// 3. The third option: dynamic loading
{
  const s = newSlide("Content Cream", "The third option", "Dynamic loading: map it when a feature needs it", N.loading);
  timelinePanel(s, M, 2.3, 6.6, 3.4, "Dynamic loading", "The app launches without it. dlopen maps the framework the first time a feature calls in.", [[0.1, 0.7, K.charcoal, "app"], [2.15, 2.95, K.terra, "dlopen"]], K.paper);
  const cx = M + 6.9, cw = R - cx, ch = 1.03;
  card(s, cx, 2.3, cw, ch, "Off the launch path", "Nothing extra happens before main().", { descGap: 0.34 });
  card(s, cx, 2.3 + ch + 0.155, cw, ch, "Unused means never mapped", "A session that skips the feature never pays.", { descGap: 0.34 });
  card(s, cx, 2.3 + 2 * (ch + 0.155), cw, ch, "Missing fails the call", "Not the launch. The app still starts.", { descGap: 0.34 });
  punch(s, "It’s the least used of the three, because the raw API is strings and casts.", 6.0);
}

// 4. Raw dlopen pain
{
  const s = newSlide("Content Cream", "Where it breaks", "Raw dlopen is strings and casts", N.pain);
  codePanel(s, M, 2.0, 7.4, 1.75, "Plugin · MouseImplementation, by hand",
`@_cdecl("create_animal")
public func createAnimal() -> UnsafeMutableRawPointer {
    Unmanaged.passRetained(Mouse()).toOpaque()  // Mouse is a class
}`, { fill: K.paper, size: 12.5 });
  codePanel(s, M, 3.9, 7.4, 2.75, "Host · loading it with dlopen",
`let path = Bundle.main.privateFrameworksPath!
    + "/MouseImplementation.framework/MouseImplementation"
let handle = dlopen(path, RTLD_NOW)!
let symbol = dlsym(handle, "create_animal")!
typealias Create = @convention(c) () -> UnsafeMutableRawPointer
let create = unsafeBitCast(symbol, to: Create.self)
let object = Unmanaged<AnyObject>.fromOpaque(create())
    .takeRetainedValue()
let animal = object as! Animal`, { fill: K.paper, size: 12.5 });
  const cx = 8.6, cw = R - cx;
  card(s, cx, 2.0, cw, 1.4, "Strings on both sides", "\"create_animal\" and the framework path. A typo compiles, then fails at runtime.");
  card(s, cx, 3.55, cw, 1.4, "Casts you have to trust", "unsafeBitCast and as! Animal. A wrong signature or interface crashes.");
  card(s, cx, 5.1, cw, 1.4, "Repeated at every call site", "Error handling, caching, threading and lifetime, all written by hand.");
}

// 4. Meta prior art
{
  const s = newSlide("Content Paper", "Prior art", "Meta hit the same wall and built infrastructure", N.meta);
  text(s, "From “The evolution of Facebook’s iOS app architecture”, Meta Engineering, 2023", { x: M, y: 2.0, w: CW, h: 0.3, fontSize: 16, color: K.gray });
  const cw = 3.29, xs = [M, 5.02, 9.15], y = 2.65, h = 3.0;
  const steps = [
    ["2016", "Lazy dylibs", "Product code moved off the pre-main path. NSClassFromString broke, and call sites named the dylib by hand."],
    ["2018", "Generated plugins", "Buck’s build graph produced a symbol-to-dylib map and a plugin system validated at build time."],
    ["Cost", "What they report", "Hard-to-search errors, non-idiomatic code, and a generated registry that is hard to find."],
  ];
  steps.forEach(([k, t, d], i) => card(s, xs[i], y, cw, h, t, d, { kicker: k, fill: K.cream, border: K.cream }));
  stepArrow(s, xs[0] + cw + 0.25, y + h / 2 - 0.12);
  stepArrow(s, xs[1] + cw + 0.25, y + h / 2 - 0.12);
  punch(s, "Can we get the 2018 result with nothing but stock Swift and Xcode?", 6.0);
}

// 5. Solution: three roles
addSection("Solution");
{
  const s = newSlide("Content Cream", "The pattern", "Three roles, one macro each", N.solution);
  const roles = [
    ["1 · Interface", "@DyLibInterface", "A protocol, shared by all", "Shipped as one .dynamic library. Linked by the app and by every plugin."],
    ["2 · Plugin", "@DyLibExport", "Implements the protocol", "Embedded in the app bundle and linked by nobody. The app never imports it."],
    ["3 · Connection", "@DyLibConnect", "A typed handle to a plugin", "Names the interface and the framework. Works in the app or inside another plugin."],
  ];
  const pw = 3.68, gap = (CW - 3 * pw) / 2, y = 2.3, h = 3.4;
  roles.forEach(([k, mac, t, d], i) => {
    const x = M + i * (pw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: pw, h, rectRadius: 0.1, fill: { color: K.paper }, line: { color: K.border, width: 0.5 } });
    text(s, k.toUpperCase(), { x: x + 0.28, y: y + 0.25, w: pw - 0.56, h: 0.26, fontSize: 12, bold: true, charSpacing: 1, color: K.gray });
    text(s, mac, { x: x + 0.28, y: y + 0.65, w: pw - 0.56, h: 0.4, fontFace: MONO, fontSize: 17, bold: true, color: K.terra });
    text(s, t, { x: x + 0.28, y: y + 1.25, w: pw - 0.56, h: 0.32, fontSize: 16, bold: true });
    text(s, d, { x: x + 0.28, y: y + 1.7, w: pw - 0.56, h: 1.1, fontSize: 13, color: K.gray, lineSpacingMultiple: 1.15 });
  });
  punch(s, "No registry, no manager, no identifier strings, no symbol names in user code.", 6.0);
}

// 6. Architecture: linked vs loaded
{
  const s = newSlide("Content Paper", "Linked vs. loaded", "Implementations are embedded, never linked", N.architecture);
  // app executable
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 2.05, w: CW, h: 0.72, rectRadius: 0.08, fill: { color: K.cream }, line: { color: K.ink, width: 1 } });
  text(s, "App executable", { x: M + 0.25, y: 2.13, w: 3, h: 0.28, fontSize: 14, bold: true });
  text(s, "@DyLibConnect(Animal.self, framework: \"MouseImplementation\", logger: DebugLogger.self)", { x: M + 0.25, y: 2.43, w: 9.5, h: 0.26, fontFace: MONO, fontSize: 12, color: K.gray });
  text(s, "names frameworks, never imports them", { x: R - 3.3, y: 2.13, w: 3.05, h: 0.28, fontSize: 12, color: K.gray, align: "right" });
  // plugin band
  const by = 3.15, bh = 1.55;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: by, w: CW, h: bh, rectRadius: 0.1, fill: { color: "FBF3EE" }, line: { color: K.terra, width: 1.25, dashType: "dash" } });
  text(s, "EMBEDDED · DLOPEN ON FIRST USE", { x: M + 0.25, y: by + bh - 0.36, w: 5, h: 0.24, fontSize: 11, bold: true, charSpacing: 0.5, color: K.terra });
  const plugins = [["MouseImplementation", "Mouse: Animal"], ["CatImplementation", "Cat: Animal"], ["DogImplementation", "Dog: Animal"], ["TrickImplementation", "Backflip: Trick"]];
  const pw = 2.5, pg = (CW - 0.5 - 4 * pw) / 3;
  plugins.forEach(([n, sub], i) => {
    const x = M + 0.25 + i * (pw + pg);
    box(s, x, by + 0.2, pw, 0.88, n, sub, { border: K.terra, dash: "dash", bw: 1.25, subSize: 12 });
    if (i < 3) arrowDown(s, x + pw / 2, 2.77, by + 0.2);
  });
  const dogR = M + 0.25 + 2 * (pw + pg) + pw, trickL = M + 0.25 + 3 * (pw + pg);
  arrowRight(s, dogR + 0.03, trickL - 0.03, by + 0.64);
  text(s, "Cat and Dog connect to Trick on first speak()", { x: M + 5.6, y: by + bh - 0.36, w: 5.7, h: 0.24, fontSize: 11, color: K.terra, align: "right" });
  // linked band
  const ly = 4.95, lh = 1.5;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: ly, w: CW, h: lh, rectRadius: 0.1, fill: { color: K.cream }, line: { color: K.charcoal, width: 1 } });
  text(s, "LINKED · DYLD LOADS BEFORE MAIN()", { x: M + 0.25, y: ly + 0.12, w: 5, h: 0.24, fontSize: 11, bold: true, charSpacing: 0.5, color: K.charcoal });
  text(s, "linked by the app and the plugins that use them, one copy each", { x: M + 5.6, y: ly + 0.12, w: 5.7, h: 0.24, fontSize: 11, color: K.gray, align: "right" });
  const linked = [["AnimalInterface", "protocol Animal"], ["TrickInterface", "protocol Trick"], ["DemoLogging", "enum DebugLogger"], ["Dynasty", "macros + loader"]];
  linked.forEach(([n, sub], i) => box(s, M + 0.25 + i * (pw + pg), ly + 0.48, pw, 0.82, n, sub, { border: K.ink, subSize: 12 }));
}

// 7. Code: interface + plugin
{
  const s = newSlide("Content Paper", "From the demo", "An interface and a plugin, complete", N.codeInterface);
  const w = 5.63;
  codePanel(s, M, 2.1, w, 2.6, "Interface · AnimalInterface.swift",
`import Dynasty

@DyLibInterface
public protocol Animal {
    func speak() -> String
}`, { size: 14 });
  codePanel(s, M + w + 0.3, 2.1, w, 2.6, "Plugin · MouseImplementation/Mouse.swift",
`import AnimalInterface
import Dynasty

@DyLibExport(Animal.self)
public struct Mouse: Animal {
    public init() {}
    public func speak() -> String { "Squeak!" }
}`, { size: 13.5 });
  card(s, M, 5.0, w, 1.25, "Generates the typed spec and lazy proxy", "AnimalPluginSpec loads and checks plugins. AnimalLazyProxy is an Animal that loads on first use.");
  card(s, M + w + 0.3, 5.0, w, 1.25, "Generates the C entry point", "No handwritten @_cdecl. If Mouse stops conforming to Animal, it does not compile.");
}

// 8. Code: the Mouse connection
{
  const s = newSlide("Content Cream", "From the demo", "The host connects by type, not by symbol", N.codeConnect);
  codePanel(s, M, 2.05, CW, 2.35, "Host · DynamicLoadingDemo/ViewController.swift",
`@DyLibConnect(Animal.self, framework: "MouseImplementation", logger: DebugLogger.self)
enum MousePlugin {}

@IBAction private func runMouse(_ sender: UIButton) {
    show(MousePlugin.instance)
}`, { fill: K.paper, size: 15 });
  const w = (CW - 0.6) / 3, y = 4.75, h = 1.6;
  card(s, M, y, w, h, "Names a type, not a symbol", "Animal.self and a framework name. No @_cdecl string on either side.");
  card(s, M + w + 0.3, y, w, h, "instance is an Animal", "A lazy proxy. Creating it loads nothing; the first call does.");
  card(s, M + 2 * (w + 0.3), y, w, h, "logger: is optional", "Leave it out and nothing is logged. More on this later.");
}

// 9. Mouse: what the macros expand to on both sides
{
  const s = newSlide("Content Paper", "Under the hood", "Mouse and its host derive the same entry symbol", N.macros);
  const lw = 3.8, gap = 0.5, rx = M + lw + gap, rw = CW - lw - gap;
  const rows = [
    [2.0, 2.0, "Plugin · you write",
`@DyLibExport(Animal.self)
public struct Mouse: Animal {
    …
}`,
     "Expands to · MouseImplementation",
`@_cdecl("__dylib_entry_Animal")
public func __dylib_export_Mouse() -> UnsafeMutableRawPointer {
    dyLibMakeEntry(spec: AnimalPluginSpec.self, factory: {
        Mouse() as any Animal
    })
}`],
    [4.15, 2.4, "Host · you write",
`@DyLibConnect(
  Animal.self,
  framework:
    "MouseImplementation",
  logger: DebugLogger.self)
enum MousePlugin {}`,
     "Expands to (abridged) · ViewController.swift",
`static let _dylibLazy = DyLibLazyPlugin<AnimalPluginSpec>(
    logger: DebugLogger.self, library: { library })
static var instance: any Animal {
    AnimalLazyProxy { try _dylibLazy.loadIfNeeded() }
}
// AnimalPluginSpec.symbolName == "__dylib_entry_Animal"`],
  ];
  rows.forEach(([y, h, l1, c1, l2, c2]) => {
    codePanel(s, M, y, lw, h, l1, c1, { size: 13, fill: K.paper, border: true });
    stepArrow(s, M + lw + (gap - 0.34) / 2, y + h / 2 - 0.12);
    codePanel(s, rx, y, rw, h, l2, c2, { size: 12.5 });
  });
}

// 10. Recursion: Cat loads Trick
{
  const s = newSlide("Content Cream", "Plugins all the way down", "A plugin can lazily load another plugin", N.recursion);
  const ws = [3.0, 3.5, 3.0], bg = (CW - 9.5) / 2, by = 2.2, bh = 1.15;
  const boxes = [
    ["DynamicLoadingDemo.app", "CatPlugin.instance.speak()", null, { fill: K.paper, border: K.ink }],
    ["CatImplementation", "Cat.speak()\n→ TrickPlugin.instance.perform()", "exports __dylib_entry_Animal", { fill: K.paper, border: K.terra, dash: "dash", bw: 1.25 }],
    ["TrickImplementation", "Backflip.perform()\n→ \"backflip\"", "exports __dylib_entry_Trick", { fill: K.paper, border: K.terra, dash: "dash", bw: 1.25 }],
  ];
  boxes.forEach(([t, sub, sym, o], i) => {
    const bw = ws[i], x = M + ws.slice(0, i).reduce((a, b) => a + b + bg, 0);
    box(s, x, by, bw, bh, t, sub, { ...o, titleSize: 14, subSize: 11.5, subColor: K.ink });
    if (sym) text(s, sym, { x, y: by + bh + 0.1, w: bw, h: 0.26, fontFace: MONO, fontSize: 11, color: K.terra, align: "center" });
    if (i < 2) {
      const ax = x + bw + 0.08;
      arrowRight(s, ax, ax + bg - 0.16, by + bh / 2);
      text(s, i === 0 ? "dlopen on\nfirst speak()" : "dlopen on\nfirst perform()", { x: ax, y: by + bh / 2 - 0.5, w: bg - 0.16, h: 0.42, fontSize: 10, color: K.terra, align: "center" });
    }
  });
  codePanel(s, M, 4.0, 5.63, 2.45, "TrickImplementation/Backflip.swift",
`import TrickInterface
import Dynasty

@DyLibExport(Trick.self)
public struct Backflip: Trick {
    public init() {}
    public func perform() -> String { "backflip" }
}`, { fill: K.paper, size: 12.5 });
  const cx = M + 5.93, cw = 5.63;
  codePanel(s, cx, 4.0, cw, 1.2, "Console · first tap on Run Cat",
`[DyLib] Animal from CatImplementation in … ms (ok)
[DyLib] Trick from TrickImplementation in … ms (ok)
Animal says: Meow! (and does a backflip)`, { dark: true, plain: true, size: 12 });
  card(s, cx, 5.4, cw, 1.05, "Nothing links Trick", "Cat declares a connection like the app does.", { descGap: 0.36 });
}

// 11. First call sequence
{
  const s = newSlide("Content Cream", "The first call", "What happens on MousePlugin.instance.speak()", N.sequence);
  const steps = [
    ["Proxy call", "The proxy is stateless. Creating it loaded nothing."],
    ["Lazy plugin", "Takes the connection’s lock, so concurrent first calls become one load."],
    ["Loader", "Opens the image and its dependencies, never holding its lock across dlopen."],
    ["Lookup", "dlsym finds the derived entry symbol in that image only."],
    ["Validate", "Checks the header, calls the factory, caches the instance."],
  ];
  const gap = 0.42, cw = (CW - 4 * gap) / 5, y = 2.3, h = 3.35;
  steps.forEach(([t, d], i) => {
    const x = M + i * (cw + gap);
    card(s, x, y, cw, h, t, d, { kicker: String(i + 1), kickerH: 0.62, titleSize: 15 });
    if (i < 4) stepArrow(s, x + cw + 0.04, y + h / 2 - 0.12);
  });
  punch(s, "Failures are not cached: if the framework is missing, the next call retries.", 6.0);
}

// 11. Validation ladder
{
  const s = newSlide("Content Paper", "Trust nothing yet", "Five checks before the host trusts a plugin", N.ladder);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 2.15, w: 5.95, h: 4.3, rectRadius: 0.1, fill: { color: K.cream }, line: { color: K.cream, width: 0 } });
  text(s, "WHAT THE PLUGIN ENTRY RETURNS", { x: M + 0.35, y: 2.42, w: 5, h: 0.26, fontSize: 11, bold: true, charSpacing: 0.5, color: K.gray });
  s.addText([
    { text: "@frozen struct DyLibEntryHeader", options: { bold: true, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "+0  magic       0x44594C42 \"DYLB\"", options: { breakLine: true } },
    { text: "+4  abiVersion  DyLibABI.current", options: { breakLine: true } },
    { text: "+8  box → DyLibPluginEntry", options: { breakLine: true } },
    { text: "      specType      AnimalPluginSpec.self", options: { breakLine: true } },
    { text: "      makeInstance  { Mouse() as any Animal }" },
  ], { isTextBox: true, x: M + 0.35, y: 2.9, w: 5.5, h: 2.6, margin: 0, valign: "top", fontFace: MONO, fontSize: 14, color: K.ink, lineSpacingMultiple: 1.2 });
  text(s, "Only the 16-byte header crosses as C data. The box is not read as Swift until the header passes.", { x: M + 0.35, y: 5.55, w: 5.3, h: 0.7, fontSize: 14, color: K.gray });
  const checks = [
    ["Symbol present", "symbolNotFound"],
    ["Magic is DYLB", "invalidEntry"],
    ["ABI version matches", "abiMismatch"],
    ["Spec metadata is identical", "specTypeMismatch"],
    ["Value casts to the protocol", "specTypeMismatch"],
  ];
  checks.forEach(([t, e], i) => {
    const y = 2.2 + i * 0.86;
    text(s, String(i + 1), { x: 7.25, y: y - 0.08, w: 0.45, h: 0.5, fontFace: HEAD, fontSize: 28, color: K.terra });
    text(s, t, { x: 7.8, y, w: 4.6, h: 0.3, fontSize: 15, bold: true });
    text(s, [{ text: "else ", options: { color: K.gray } }, { text: e, options: { fontFace: MONO, color: K.red } }], { x: 7.8, y: y + 0.32, w: 4.6, h: 0.28, fontSize: 13 });
  });
}

// 12. Golden rule
{
  const s = newSlide("Content Cream", "The golden rule", "One copy of every shared module per process", N.golden);
  text(s, "Swift type identity is metadata identity, not the spelling of the name.", { x: M, y: 2.0, w: CW, h: 0.35, fontSize: 16, color: K.gray });
  const w = 5.63, y = 2.6, h = 2.6;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w, h, rectRadius: 0.1, fill: { color: K.paper }, line: { color: K.border, width: 0.5 } });
  text(s, "✓  One shared dynamic framework", { x: M + 0.28, y: y + 0.22, w: w - 0.56, h: 0.32, fontSize: 16, bold: true, color: K.green });
  text(s, "Host and plugin both point at the same AnimalPluginSpec metadata.", { x: M + 0.28, y: y + 0.62, w: w - 0.56, h: 0.5, fontSize: 13, color: K.gray });
  text(s, "ObjectIdentifier(entry.specType)\n  == ObjectIdentifier(S.self)", { x: M + 0.28, y: y + 1.35, w: w - 0.56, h: 0.7, fontFace: MONO, fontSize: 14, color: K.green });
  const x2 = M + w + 0.3;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x2, y, w, h, rectRadius: 0.1, fill: { color: K.paper }, line: { color: K.border, width: 0.5 } });
  text(s, "✗  Interface statically duplicated", { x: x2 + 0.28, y: y + 0.22, w: w - 0.56, h: 0.32, fontSize: 16, bold: true, color: K.red });
  text(s, "Same name, two metadata records: one per image that copied it in.", { x: x2 + 0.28, y: y + 0.62, w: w - 0.56, h: 0.5, fontSize: 13, color: K.gray });
  text(s, "throw DyLibError.specTypeMismatch(\n  expected: \"AnimalPluginSpec\",\n  found: \"AnimalPluginSpec\")", { x: x2 + 0.28, y: y + 1.2, w: w - 0.56, h: 1.05, fontFace: MONO, fontSize: 14, color: K.red });
  codePanel(s, M, 5.45, CW, 1.1, "Package.swift · every interface module",
    `.library(name: "AnimalInterface", type: .dynamic, targets: ["AnimalInterface"])`, { fill: K.paper, size: 14 });
}

// 13. Logger code
addSection("DyLibLoadLogger");
{
  const s = newSlide("Content Paper", "Optional logging", "Add a logger to see every load and what it cost", N.logger);
  codePanel(s, M, 2.0, CW, 2.95, "DemoLogging/DebugLogger.swift",
`public enum DebugLogger: DyLibLoadLogger {
    public static func didLoad(_ event: DyLibLoadResult) {
        #if DEBUG
        let framework = (event.path as NSString).lastPathComponent
        let milliseconds = String(format: "%.2f", event.duration * 1000)
        let outcome = event.error.map { "error: \\($0.localizedDescription)" } ?? "ok"
        NSLog("[DyLib] %@ from %@ in %@ ms (%@)", event.interface, framework, milliseconds, outcome)
        #endif
    }
}`, { size: 13 });
  const lw = 4.8;
  codePanel(s, M, 5.1, lw, 1.45, "Wired in · ViewController.swift",
`@DyLibConnect(Animal.self,
    framework: "MouseImplementation",
    logger: DebugLogger.self)`, { size: 13 });
  codePanel(s, M + lw + 0.3, 5.1, CW - lw - 0.3, 1.45, "Console · first tap on Run Mouse",
`[DyLib] Animal from MouseImplementation in \u2026 ms (ok)
Animal says: Squeak!`, { dark: true, plain: true, size: 13 });
}

// 14. Logger semantics
{
  const s = newSlide("Content Cream", "Logger semantics", "Honest numbers, zero cost when unused", N.loggerRules);
  const w = 5.63, h = 1.6;
  const items = [
    ["One event per real load", "Cache hits are silent. Failures aren’t cached, so every retry logs its own event."],
    ["Success and failure", "didLoad fires either way, even right before a non-throwing requirement traps."],
    ["Measured, or not at all", "Uptime clock from first call to usable instance. Without logger:, no clock is read."],
    ["Never re-enter the connection", "Callbacks run outside the loader’s lock but inside the connection’s own."],
  ];
  items.forEach(([t, d], i) => card(s, M + (i % 2) * (w + 0.3), 2.1 + Math.floor(i / 2) * (h + 0.25), w, h, t, d));
  punch(s, "A type, not an instance: there is no global logger, so each connection chooses its own.", 6.0);
}

// 15. Demo walkthrough
{
  const s = newSlide("Content Paper", "Try it in the demo", "Tap, watch the console, then break it on purpose", N.demo);
  const con = (t) => ({ text: t, options: { fontFace: MONO, fontSize: 13 } });
  table(s, [
    ["Action", "Debug console", "Why"],
    ["Launch the app", { text: "nothing", options: { color: K.dim } }, "Only interfaces, DemoLogging and the runtime are linked."],
    ["Tap Run Cat", con("Animal from CatImplementation\nTrick from TrickImplementation"), "Cat loads, then Cat’s own Trick connection."],
    ["Tap Run Cat again", { text: "nothing", options: { color: K.dim } }, "Cache hit. No event."],
    ["Tap Run Dog", con("Animal from DogImplementation\nTrick from TrickImplementation"), "Dog has its own Trick connection; the image is already resident."],
    ["Delete CatImplementation", { text: "app launches; Run Cat logs the error, then traps", options: { color: K.terra } }, "Non-throwing speak() traps. try CatPlugin.loadIfNeeded() handles it."],
    ["Delete AnimalInterface", { text: "app won’t launch", options: { color: K.red } }, "dyld requires every linked framework."],
  ], { y: 2.0, colW: [2.9, 3.9, 4.76], size: 14 });
}

// 16. App Store
addSection("Shipping");
{
  const s = newSlide("Content Cream", "App Store review", "Allowed, because every plugin ships in the bundle", N.appstore);
  text(s, "Guideline 2.5.2: apps must be self-contained and may not download or execute code that changes features.", { x: M, y: 2.0, w: CW, h: 0.35, fontSize: 16, color: K.gray });
  table(s, [
    ["Compatible", "Not allowed"],
    ["Loading frameworks inside the submitted .app", "Downloading a .framework or .dylib after install"],
    ["Choosing when to load: lazily, on first use", "Patching shipped binaries after review"],
    ["Choosing which bundled plugin to load", "Using plugins to hide functionality from review"],
  ], { y: 2.6, colW: [5.78, 5.78], hdrColors: [K.green, K.red], hdrFill: K.paper, zebra: K.paper, size: 15, rowH: 0.5 });
  card(s, M, 5.1, 5.63, 1.35, "Public APIs only", "dlopen, dlsym and dlclose on frameworks built, signed and embedded in your app.");
  card(s, M + 5.93, 5.1, 5.63, 1.35, "Signing is enforced on device", "A modified or swapped framework won’t load. The simulator is more lenient.");
}

// 17. Closing
addSection("Close");
{
  const s = pres.addSlide({ masterName: "Closing", sectionTitle: section });
  s.addText("TAKEAWAYS", { placeholder: "eyebrow" });
  s.addText("Off the launch path, checked by the compiler", { placeholder: "title" });
  text(s, "Macros replace strings. The runtime validates every boundary. Add a logger and every lazy load reports what it cost.", { x: M, y: 3.15, w: 7.2, h: 0.75, fontSize: 17, color: K.darkBody, lineSpacingMultiple: 1.2 });
  codePanel(s, M, 4.15, 7.7, 2.2, null,
`@DyLibConnect(Animal.self, framework: "MouseImplementation",
              logger: DebugLogger.self)
enum MousePlugin {}

MousePlugin.instance.speak()   // dlopen happens here`, { dark: true, size: 14 });
  text(s, "Questions?", { x: 9.0, y: 4.2, w: 3.7, h: 0.6, fontFace: HEAD, fontSize: 32, color: K.cream });
  text(s, "github.com/winstondu/DyLibRuntimeLoader", { x: 9.0, y: 4.95, w: 3.6, h: 0.3, fontSize: 13, color: K.darkBody });
  text(s, "Demo app: Demo/DynamicLoadingDemo", { x: 9.0, y: 5.35, w: 3.7, h: 0.3, fontSize: 14, color: K.darkBody });
  s.addNotes(N.close);
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
