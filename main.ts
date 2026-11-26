// The World in One Image — 26 November 2026 (R2 rebuild)
// Draws a 1024x1024 newspaper front page summarising the world's news of
// Thursday 26 November 2026 to $MAKEFUN_OUTPUT_DIR/entry.png.
// Node.js standard library only: no dependencies, no network, no external
// files. Every pixel is drawn by this program (5x7 bitmap font + hand-made
// PNG encoder + hand-drawn vector scenes).
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- font ---
// 5x7 bitmap font. Each glyph is 7 rows of 5 characters ('#' = on).
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
};

// ------------------------------------------------------------- canvas ----
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [251, 247, 238];
const INK: [number, number, number] = [25, 25, 25];
const RED: [number, number, number] = [176, 30, 40];
const BLUE: [number, number, number] = [31, 78, 121];
const GOLD: [number, number, number] = [200, 145, 42];
const BROWN: [number, number, number] = [139, 90, 43];
const GRAY: [number, number, number] = [107, 107, 107];

const buf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x0: number, x1: number, y: number, c: [number, number, number]): void {
  for (let x = x0; x <= x1; x++) px(x, y, c);
}
function vline(x: number, y0: number, y1: number, c: [number, number, number]): void {
  for (let y = y0; y <= y1; y++) px(x, y, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: [number, number, number]): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function circle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let x = cx - dx; x <= cx + dx; x++) px(x, cy + dy, c);
  }
}
function ring(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: [number, number, number]): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
      }
    }
    if (xs.length >= 2) {
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      for (let x = lo; x <= hi; x++) px(x, y, c);
    }
  }
}

function normChar(ch: string): string {
  if (FONT[ch]) return ch;
  const map: Record<string, string> = { "’": "'", "‘": "'", "–": "-", "—": "-", "×": "x", "…": ".", "₹": "$", "é": "e" };
  return map[ch] ?? "?";
}
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  let cx = x;
  for (const raw of s) {
    const ch = normChar(raw);
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") {
          rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}
function drawTextCentered(s: string, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, Math.round((W - textWidth(s, scale)) / 2), y, scale, c);
}

// ---------------------------------------------------------------- data ---
// Every story happened or was first reported on 26 November 2026 (any time
// zone). Regions and fields are counted by the program, never hardcoded.
type Story = { text: string; region: string; field: string };
const STORIES: Story[] = [
  { text: "HOUTHI DRONES HIT SAUDI RAS TANURA REFINERY; BRENT TOPS $94", region: "MIDDLE EAST", field: "ENERGY" },
  { text: "TRUMP UNVEILS TARIFF PLAN ON 14 TRADING PARTNERS", region: "NORTH AMERICA", field: "TRADE" },
  { text: "EU LEADERS OPEN TWO-DAY SUMMIT ON BUDGET, UKRAINE CASH", region: "EUROPE", field: "POLITICS" },
  { text: "TWO OIL TANKERS HIT NAVAL MINES IN THE STRAIT OF HORMUZ", region: "MIDDLE EAST", field: "SHIPPING" },
  { text: "ISRAEL STRIKES HAMAS COLONEL IN GAZA; CEASEFIRE UNDER STRAIN", region: "MIDDLE EAST", field: "DEFENSE" },
  { text: "UKRAINE HITS TWO RUSSIAN REFINERIES OVERNIGHT; PUTIN VOWS REPLY", region: "EUROPE", field: "DEFENSE" },
  { text: "RUSSIA'S OWN FIGURES: NEARLY 500,000 LOST IN UKRAINE WAR", region: "EUROPE", field: "CONFLICT" },
  { text: "POLAND ASKS NATO TO DOWN RUSSIAN MISSILES OVER UKRAINE", region: "EUROPE", field: "DIPLOMACY" },
  { text: "FRANCE OFFERS ENVOY TO MOSCOW IF EUROPE GETS FULL SEAT AT TALKS", region: "EUROPE", field: "DIPLOMACY" },
  { text: "BANK OF KOREA HIKES RATE TO 3.25%; LIFTS 2026 GROWTH VIEW TO 3.9%", region: "EAST ASIA", field: "CENTRAL BANKS" },
  { text: "BOJ'S TAMURA TALKS HAWKISH BEFORE DECEMBER RATE DECISION", region: "EAST ASIA", field: "CENTRAL BANKS" },
  { text: "US TIGHTENS REMOTE AI CHIP ACCESS; NVIDIA B300 CHIPS SEEK BUYERS", region: "NORTH AMERICA", field: "TECH" },
  { text: "ECONOMISTS WARN AI BUBBLE BURST COULD TOP THE DOT-COM CRASH", region: "GLOBAL", field: "ECONOMY" },
  { text: "ASIAN MARKETS STEADY: ASX UP, GOLD $3,570, BRENT $94.65", region: "EAST ASIA", field: "MARKETS" },
  { text: "US MARKETS SHUT FOR THANKSGIVING; BOND MARKET CLOSED TOO", region: "NORTH AMERICA", field: "MARKETS" },
  { text: "NOR'EASTER SLAMS US EAST COAST ON THANKSGIVING; 250M IN ITS PATH", region: "NORTH AMERICA", field: "WEATHER" },
  { text: "US ATTORNEY GENERAL DODGES QUESTIONS ON NVIDIA PROBE", region: "NORTH AMERICA", field: "JUSTICE" },
  { text: "BEPICOLOMBO REACHES MERCURY ORBIT AFTER EIGHT-YEAR JOURNEY", region: "SPACE", field: "SPACE" },
  { text: "CLOSE-UP IMAGES OF ASTEROID HIT TO TEST EARTH DEFENCE REVEALED", region: "SPACE", field: "SCIENCE" },
  { text: "DURAN DURAN GUITARIST ANDY TAYLOR DIES AT 65", region: "EUROPE", field: "CULTURE" },
  { text: "GUKESH HELD TO 20-MOVE DRAW BY SINDAROV IN WORLD CHESS FINAL", region: "EUROPE", field: "SPORTS" },
  { text: "IPL 2027 AUCTION DRAWS 1,220 PLAYER REGISTRATIONS", region: "SOUTH ASIA", field: "SPORTS" },
  { text: "INDIA A FACE SRI LANKA A IN RISING STARS SEMI-FINAL IN DOHA", region: "SOUTH ASIA", field: "SPORTS" },
  { text: "INDIA MARKS CONSTITUTION DAY AND 18 YEARS SINCE 26/11 ATTACKS", region: "SOUTH ASIA", field: "POLITICS" },
  { text: "IITS TO ADD 6,000 SEATS IN ROBOTICS, AI AND SPACE TECHNOLOGY", region: "SOUTH ASIA", field: "EDUCATION" },
  { text: "INDIA'S SPACE ECONOMY TO GROW FROM $9BN TO $45BN IN A DECADE", region: "SOUTH ASIA", field: "SPACE" },
  { text: "INDIA ANNOUNCES RS15,000-CRORE PACKAGE FOR NEPAL AFTER MODI TALKS", region: "SOUTH ASIA", field: "DIPLOMACY" },
  { text: "INDIA URGES HUMAN CONTROL OVER AI IN MILITARY OPERATIONS", region: "SOUTH ASIA", field: "TECH" },
  { text: "FLIPKART CEO KALYAN KRISHNAMURTHY TO STEP DOWN IN DECEMBER", region: "SOUTH ASIA", field: "BUSINESS" },
  { text: "TWO INDIANS HURT IN RIYADH TOWER ATTACK; INDIA CONDEMNS STRIKE", region: "MIDDLE EAST", field: "TERRORISM" },
  { text: "SHEIKH HASINA SEEKS RETURN TO BANGLADESH ON DECEMBER 16", region: "SOUTH ASIA", field: "POLITICS" },
  { text: "BANGLADESH RAISES GARMENT MINIMUM WAGE BY 36 PERCENT", region: "SOUTH ASIA", field: "LABOR" },
  { text: "BANGLADESH DEPLOYS 108 BORDER GUARD PLATOONS AMID UNREST FEARS", region: "SOUTH ASIA", field: "SECURITY" },
  { text: "NORTH KOREA ORDERS SWITZERLAND TO CLOSE PYONGYANG OFFICE", region: "EAST ASIA", field: "DIPLOMACY" },
  { text: "SOLOMON ISLANDS AND AUSTRALIA SIGN HISTORIC SECURITY TREATY", region: "OCEANIA", field: "DEFENSE" },
  { text: "COLOMBIA POLICE STORM SUPERMARKET, FREE 20 HELD HOSTAGE 17 HOURS", region: "LATIN AMERICA", field: "CRIME" },
  { text: "UN CHIEF PRAISES COLOMBIA'S DECADE OF PEACE PROGRESS", region: "LATIN AMERICA", field: "DIPLOMACY" },
  { text: "BRAZIL MOSQUITOES CUT VIRAL INFECTIONS BY 68 PERCENT", region: "LATIN AMERICA", field: "HEALTH" },
  { text: "ISLAND SCHOOL LETS FAMILIES PAY TUITION WITH COCONUTS", region: "OCEANIA", field: "EDUCATION" },
  { text: "EMIRATES TOPS GLOBAL AIRLINE RANKINGS", region: "MIDDLE EAST", field: "AVIATION" },
  { text: "TURKISH MILITARY HELICOPTER CRASHES IN TRAINING; FIVE KILLED", region: "EUROPE", field: "DEFENSE" },
  { text: "GOOGLE FACES $146M LEGAL ACTION IN MALAYSIA", region: "EAST ASIA", field: "JUSTICE" },
  { text: "US INTELLIGENCE AGENCIES SUSPECTED OF HACKING; TRACE POINTS TO CHINA", region: "NORTH AMERICA", field: "SECURITY" },
  { text: "US AIR FORCE UNVEILS F-15EX FIGHTERS AT KADENA, OKINAWA", region: "EAST ASIA", field: "DEFENSE" },
  { text: "TWO CHILDREN AMONG SIX DEAD IN PLANE CRASH OFF MISSISSIPPI COAST", region: "NORTH AMERICA", field: "AVIATION" },
  { text: "TEMPUS TO ACQUIRE PERSONALIS IN $600M MERGER DEAL", region: "NORTH AMERICA", field: "BUSINESS" },
  { text: "RAMAYANA BOX OFFICE DAY 20: SECOND RS1,000-CRORE BOLLYWOOD FILM", region: "SOUTH ASIA", field: "CULTURE" },
  { text: "ECOWAS UNVEILS ROADMAP FOR JOINT SECURITY UNIT BY END 2027", region: "AFRICA", field: "DEFENSE" },
  { text: "SAUDI NATIONAL FREED FROM SUSPECTED IS CAPTORS IN NIGER", region: "AFRICA", field: "SECURITY" },
  { text: "XI GRAFT PROBE OF SHANGHAI RISING STAR UPENDS PATH TO POWER", region: "EAST ASIA", field: "POLITICS" },
];

// Lead stories: two lines each, with a big hand-drawn scene beside them.
const LEADS: Array<{ icon: string; lines: [string, string] }> = [
  {
    icon: "flame",
    lines: [
      "HOUTHI DRONES HIT SAUDI RAS TANURA REFINERY; BRENT TOPS $94",
      "FIRES AT THE WORLD'S LARGEST OIL TERMINAL; TANKERS HIT MINES IN HORMUZ",
    ],
  },
  {
    icon: "chip",
    lines: [
      "TRUMP UNVEILS TARIFF PLAN ON 14 TRADING PARTNERS",
      "TAIWAN ANSWERS ON THE 26TH: 15 PERCENT, LOWEST TIER; CHIP STOCKS SLIDE",
    ],
  },
  {
    icon: "parliament",
    lines: [
      "EU LEADERS OPEN TWO-DAY SUMMIT ON BUDGET, UKRAINE CASH",
      "EURO SUMMIT MEETS IN BRUSSELS AS WAR SPILLS INTO POLAND",
    ],
  },
];

// UTC timeline anchors, all verified 26 November 2026 times.
const TIMELINE: Array<{ t: string; text: string }> = [
  { t: "00:27", text: "NATO MISSILES" },
  { t: "00:52", text: "BOK HIKES 3.25%" },
  { t: "01:00", text: "TAMURA HAWKISH" },
  { t: "01:27", text: "FRANCE ENVOY" },
  { t: "05:00", text: "THANKSGIVING US" },
  { t: "07:15", text: "LEADERS MEET" },
  { t: "09:00", text: "SUMMIT OPENS" },
  { t: "12:00", text: "BERLIN TALKS" },
];

// Stories that carry a drawn scene in the list (1-based story number):
// feature rows get a 24px scene and a double-height row; inline rows get a
// 14px scene inside the normal row.
const FEATURE_SCENES: Record<number, string> = { 18: "rocket", 21: "knight" };
const INLINE_SCENES: Record<number, string> = { 4: "oil", 10: "bank", 14: "chart", 22: "cricket", 39: "coconut", 44: "jet" };

// --------------------------------------------------------------- scenes --
// Each scene is drawn inside a box of size s at (x, y), in ink/red/blue.
function drawScene(kind: string, x: number, y: number, s: number): void {
  const cx = x + s / 2;
  if (kind === "flame") {
    circle(Math.round(cx), Math.round(y + s * 0.62), Math.round(s * 0.30), RED);
    triangle(Math.round(cx - s * 0.28), Math.round(y + s * 0.62), Math.round(cx + s * 0.28), Math.round(y + s * 0.62), Math.round(cx), Math.round(y + s * 0.06), RED);
    circle(Math.round(cx), Math.round(y + s * 0.66), Math.round(s * 0.17), GOLD);
    triangle(Math.round(cx - s * 0.15), Math.round(y + s * 0.62), Math.round(cx + s * 0.15), Math.round(y + s * 0.62), Math.round(cx), Math.round(y + s * 0.30), GOLD);
  } else if (kind === "chip") {
    rect(x + 2, y + 2, s - 4, s - 4, INK);
    rect(x + 5, y + 5, s - 10, s - 10, PAPER);
    rect(x + 9, y + 9, s - 18, s - 18, BLUE);
    for (let i = 0; i < 3; i++) {
      const o = 8 + i * 8;
      hline(x - 2, x + 2, y + o, INK);
      hline(x + s - 2, x + s + 2, y + o, INK);
      vline(x + o, y - 2, y + 2, INK);
      vline(x + o, y + s - 2, y + s + 2, INK);
    }
  } else if (kind === "parliament") {
    triangle(x + 2, y + 10, x + s - 2, y + 10, Math.round(cx), y + 2, INK);
    for (let i = 0; i < 4; i++) {
      const colX = x + 4 + i * ((s - 8) / 3);
      rect(Math.round(colX), y + 12, 3, s - 18, INK);
    }
    rect(x + 2, y + s - 6, s - 4, 2, INK);
    rect(x, y + s - 3, s, 2, INK);
  } else if (kind === "rocket") {
    triangle(Math.round(cx - 5), y + 9, Math.round(cx + 5), y + 9, Math.round(cx), y + 1, INK);
    rect(Math.round(cx - 5), y + 9, 10, 9, INK);
    circle(Math.round(cx), y + 13, 2, PAPER);
    triangle(Math.round(cx - 5), y + 14, Math.round(cx - 9), y + 20, Math.round(cx - 5), y + 20, RED);
    triangle(Math.round(cx + 5), y + 14, Math.round(cx + 9), y + 20, Math.round(cx + 5), y + 20, RED);
    circle(Math.round(cx), y + 21, 3, GOLD);
  } else if (kind === "knight") {
    const pts: Array<[number, number]> = [[4, 20], [4, 12], [8, 4], [13, 6], [11, 11], [15, 14], [15, 20]];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      line(x + ax, y + ay, x + bx, y + by, INK);
    }
    for (let yy = y + 12; yy <= y + 20; yy++) {
      const span = yy < y + 16 ? 2 : 4;
      hline(x + 4, x + 4 + span + 6, yy, INK);
    }
    rect(x + 2, y + 20, 20, 3, INK);
    px(x + 10, y + 8, PAPER);
  } else if (kind === "cricket") {
    rect(x + 9, y + 2, 3, 6, INK);
    rect(x + 7, y + 8, 7, 11, INK);
    circle(x + 19, y + 18, 3, RED);
  } else if (kind === "oil") {
    triangle(x + 3, y + 8, x + 11, y + 8, x + 7, y + 1, INK);
    circle(x + 7, y + 9, 4, INK);
  } else if (kind === "bank") {
    triangle(x + 1, y + 5, x + 13, y + 5, x + 7, y + 1, INK);
    for (let i = 0; i < 3; i++) rect(x + 2 + i * 4, y + 6, 2, 5, INK);
    rect(x + 1, y + 12, 12, 2, INK);
  } else if (kind === "chart") {
    vline(x + 1, y + 1, y + 12, INK);
    hline(x + 1, x + 13, y + 12, INK);
    line(x + 2, y + 10, x + 6, y + 6, RED);
    line(x + 6, y + 6, x + 9, y + 8, RED);
    line(x + 9, y + 8, x + 13, y + 2, RED);
  } else if (kind === "coconut") {
    circle(x + 7, y + 8, 5, BROWN);
    circle(x + 7, y + 7, 3, PAPER);
    line(x + 9, y + 4, x + 12, y + 1, RED);
  } else if (kind === "jet") {
    hline(x + 1, x + 13, y + 7, INK);
    line(x + 4, y + 7, x + 8, y + 3, INK);
    line(x + 6, y + 7, x + 9, y + 11, INK);
    line(x + 11, y + 7, x + 13, y + 4, INK);
  }
}

// ----------------------------------------------------------------- png ---
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (const byte of b) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------- layout ---
function main(): void {
  const regions = new Set(STORIES.map((s) => s.region)).size;
  const fields = new Set(STORIES.map((s) => s.field)).size;
  if (STORIES.length !== 50) throw new Error(`expected 50 stories, got ${STORIES.length}`);

  let y = 4;
  rect(16, y, W - 32, 3, RED);
  y = 10;
  drawTextCentered("THE WORLD IN ONE IMAGE", y, 4, INK);
  y = 44;
  drawTextCentered(
    `THURSDAY 26 NOVEMBER 2026 | ${STORIES.length} STORIES - ${regions} REGIONS - ${fields} FIELDS`,
    y,
    2,
    RED,
  );
  y = 62;
  rect(16, y, W - 32, 2, INK);

  // Leads: number box + big scene + two headline lines.
  y = 68;
  for (let i = 0; i < LEADS.length; i++) {
    const lead = LEADS[i];
    rect(16, y, 26, 26, RED);
    drawText(String(i + 1), 25, y + 6, 2, PAPER);
    drawScene(lead.icon, 48, y, 28);
    drawText(lead.lines[0], 88, y, 2, INK);
    drawText(lead.lines[1], 88, y + 14, 2, GRAY);
    y += 30;
  }
  rect(16, y + 1, W - 32, 2, INK);

  // UTC timeline: header + 4 columns x 2 rows, one line per anchor at
  // scale 2 (14px glyphs) so every time and label is clearly readable.
  y += 4;
  drawText("UTC TIMELINE - THURSDAY 26 NOV 2026", 16, y, 2, INK);
  y += 18;
  const colW = 250;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const a = TIMELINE[r * 4 + c];
      const x = 16 + c * colW;
      drawText(a.t, x, y, 2, RED);
      drawText(a.text, x + 66, y, 2, INK);
    }
    y += 15;
  }
  rect(16, y + 2, W - 32, 2, INK);

  // Full numbered list. Feature rows are double height with a 22px scene;
  // inline-scene rows carry a 14px scene inside the normal row.
  y += 5;
  for (let i = 0; i < STORIES.length; i++) {
    const n = i + 1;
    const story = STORIES[i];
    const feature = FEATURE_SCENES[n];
    const inline = INLINE_SCENES[n];
    const rowH = feature ? 26 : 15;
    const textY = feature ? y + 6 : y;
    drawText(`${String(n).padStart(2, "0")}.`, 16, textY, 2, RED);
    let tx = 56;
    if (feature) {
      drawScene(feature, 56, y + 2, 22);
      tx = 88;
    } else if (inline) {
      drawScene(inline, 56, y, 14);
      tx = 76;
    }
    drawText(story.text, tx, textY, 2, INK);
    y += rowH;
  }

  // Footer: sources + explicit date-check audit line.
  y += 2;
  drawText("SOURCES: REUTERS, YONHAP, BBC, AP, EU PRESS CLUB, MORNINGSTAR, FOX WEATHER", 16, y, 1, GRAY);
  y += 8;
  drawText(
    "DATE CHECK: EVERY STORY HAPPENED OR WAS FIRST REPORTED ON 26 NOV 2026 (ANY TIME ZONE). 24-25 NOV STORIES EXCLUDED.",
    16,
    y,
    1,
    RED,
  );
  y += 5;
  if (y > H) throw new Error(`layout overflow: final y=${y} > ${H}`);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "./out";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, encodePNG());
  fs.chmodSync(outPath, 0o644);
  console.log(`wrote ${outPath} (${regions} regions, ${fields} fields, final y=${y})`);
}

main();
