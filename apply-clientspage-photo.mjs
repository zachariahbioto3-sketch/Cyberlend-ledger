import { readFileSync, writeFileSync } from "fs";
const path = "src/components/ClientsPage.tsx";
let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const importAnchor = `import { ClientProfilePanel } from "./ClientProfilePanel";`;
if (!src.includes(`import { PhotoCapture } from "./PhotoCapture";`)) {
  if (!src.includes(importAnchor)) throw new Error("import anchor not found");
  src = src.replace(importAnchor, `${importAnchor}\nimport { PhotoCapture } from "./PhotoCapture";`);
  console.log("[ok] added PhotoCapture import");
} else console.log("[skip] import already present");

const oldBlock = `              {/* Passport photo */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>Passport Photo</p>
                <input ref={passportRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleImage("borrowerPhoto", e.target.files?.[0])} />
                <button onClick={() => passportRef.current?.click()}
                  className="w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                  style={{ borderColor: form.borrowerPhoto ? "#111214" : t.border, background: t.bgActive }}>
                  {form.borrowerPhoto ? (
                    <img src={form.borrowerPhoto} alt="passport"
                      className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6" style={{ color: t.textFaint }} />
                      <span className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>
                        UPLOAD PHOTO
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* ID card */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>ID Card Photo</p>
                <input ref={idRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleImage("borrowerIdPhoto", e.target.files?.[0])} />
                <button onClick={() => idRef.current?.click()}
                  className="w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                  style={{ borderColor: form.borrowerIdPhoto ? "#111214" : t.border, background: t.bgActive }}>
                  {form.borrowerIdPhoto ? (
                    <img src={form.borrowerIdPhoto} alt="id"
                      className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" style={{ color: t.textFaint }} />
                      <span className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>
                        UPLOAD ID
                      </span>
                    </>
                  )}
                </button>
              </div>`;

const newBlock = `              {/* Passport photo */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>Passport Photo</p>
                <PhotoCapture
                  value={form.borrowerPhoto}
                  onChange={(img) => set("borrowerPhoto", img)}
                  label="Passport Photo"
                  theme={t}
                  facingMode="user"
                />
              </div>

              {/* ID card */}
              <div>
                <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>ID Card Photo</p>
                <PhotoCapture
                  value={form.borrowerIdPhoto}
                  onChange={(img) => set("borrowerIdPhoto", img)}
                  label="ID Card Photo"
                  theme={t}
                  facingMode="environment"
                />
              </div>`;

if (src.includes(newBlock)) {
  console.log("[skip] photo block already replaced");
} else if (!src.includes(oldBlock)) {
  throw new Error("old photo block not found in ClientsPage.tsx");
} else {
  src = src.replace(oldBlock, newBlock);
  console.log("[ok] replaced photo upload block");
}

writeFileSync(path, src, "utf8");
