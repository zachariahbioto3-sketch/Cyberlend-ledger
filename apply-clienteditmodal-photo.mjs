import { readFileSync, writeFileSync } from "fs";
const path = "src/components/ClientEditModal.tsx";
let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const importAnchor = `import { compressImage } from "../utils/imageUtils";`;
if (!src.includes(`import { PhotoCapture } from "./PhotoCapture";`)) {
  if (!src.includes(importAnchor)) throw new Error("import anchor not found");
  src = src.replace(importAnchor, `${importAnchor}\nimport { PhotoCapture } from "./PhotoCapture";`);
  console.log("[ok] added PhotoCapture import");
} else console.log("[skip] import already present");

const oldBlock = `                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border cursor-pointer"
                  style={{ height: 80, borderColor: t.border, background: t.bgActive, borderStyle: "dashed" }}>
                  {form[key] ? (
                    <img src={form[key] as string} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5" style={{ color: t.textFaint }} />
                      <span className="text-[9px]" style={{ fontFamily: mono, color: t.textFaint }}>UPLOAD</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(key, e)} />
                </label>
                {key === "borrowerPhoto" && form[key] && <button type="button" onClick={() => set(key, "")} className="mt-1 text-[9px] text-red-400">REMOVE PHOTO</button>}`;

const newBlock = `                <PhotoCapture
                  value={(form[key] as string) || ""}
                  onChange={(img) => set(key, img)}
                  label={key === "borrowerPhoto" ? "Profile Photo" : "ID Photo"}
                  theme={t}
                  facingMode={key === "borrowerPhoto" ? "user" : "environment"}
                  height={80}
                />
                {form[key] && <button type="button" onClick={() => set(key, "")} className="mt-1 text-[9px] text-red-400">REMOVE PHOTO</button>}`;

if (src.includes(newBlock)) {
  console.log("[skip] photo block already replaced");
} else if (!src.includes(oldBlock)) {
  throw new Error("old photo block not found in ClientEditModal.tsx");
} else {
  src = src.replace(oldBlock, newBlock);
  console.log("[ok] replaced photo upload block");
}

writeFileSync(path, src, "utf8");
