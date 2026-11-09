import { readFileSync, writeFileSync, existsSync } from "fs";

function patch(path, edits) {
  if (!existsSync(path)) throw new Error(`Missing file: ${path}`);
  let src = readFileSync(path, "utf8");
  for (const [find, replace, label] of edits) {
    if (src.includes(replace)) { console.log(`  [skip] ${path} :: ${label} (already applied)`); continue; }
    if (!src.includes(find)) throw new Error(`Anchor not found in ${path} for "${label}".`);
    src = src.replace(find, replace);
    console.log(`  [ok]   ${path} :: ${label}`);
  }
  writeFileSync(path, src, "utf8");
}

console.log("1) Export PhotoCapture from components/index.ts");
patch("src/components/index.ts", [
  [`export { NotificationPanel } from "./NotificationPanel";`,
   `export { NotificationPanel } from "./NotificationPanel";\nexport { PhotoCapture } from "./PhotoCapture";`,
   "add PhotoCapture export"],
]);

console.log("2) Issue 1 fix — bgModal now points at solid --popover instead of near-transparent --card");
patch("src/App.tsx", [
  [`  bgModal:      "var(--card)",`,
   `  bgModal:      "var(--popover)",`,
   "fix bgModal transparency (fixes all 8 modal files at once)"],
]);

console.log("3) Issue 2 fix — mojibake em dashes in NewLoanModal.tsx");
patch("src/components/NewLoanModal.tsx", [
  [`"NEW LOAN â€” RETURNING CLIENT"`, `"NEW LOAN — RETURNING CLIENT"`, "fix mojibake em dash #1"],
  [`outstanding â€” rolled into new loan`, `outstanding — rolled into new loan`, "fix mojibake em dash #2"],
  [`{/* Phone â€” triggers returning client lookup */}`, `{/* Phone — triggers returning client lookup */}`, "fix mojibake em dash #3"],
]);

console.log("\nAll patches applied successfully.");
