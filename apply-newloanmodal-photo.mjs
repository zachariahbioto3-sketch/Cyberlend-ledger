import { readFileSync, writeFileSync } from "fs";
const path = "src/components/NewLoanModal.tsx";
let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const steps = [
  [`import { AgreementForm } from "./AgreementForm";`,
   `import { AgreementForm } from "./AgreementForm";\nimport { PhotoCapture } from "./PhotoCapture";`,
   "import PhotoCapture"],
  [`  const [borrowerEmail,  setBorrowerEmail]  = useState(prefillClient?.borrowerEmail  || "");`,
   `  const [borrowerEmail,  setBorrowerEmail]  = useState(prefillClient?.borrowerEmail  || "");\n  const [borrowerPhoto,   setBorrowerPhoto]   = useState(prefillClient?.borrowerPhoto   || "");\n  const [borrowerIdPhoto, setBorrowerIdPhoto] = useState(prefillClient?.borrowerIdPhoto || "");`,
   "add photo state"],
  [`    if (isReturning && latestLoan && !prefillClient) {\n      setBorrowerName(latestLoan.borrowerName);\n      setBorrowerEmail(latestLoan.borrowerEmail || "");\n    }`,
   `    if (isReturning && latestLoan && !prefillClient) {\n      setBorrowerName(latestLoan.borrowerName);\n      setBorrowerEmail(latestLoan.borrowerEmail || "");\n      setBorrowerPhoto(latestLoan.borrowerPhoto || "");\n      setBorrowerIdPhoto(latestLoan.borrowerIdPhoto || "");\n    }`,
   "auto-fill photos for returning client"],
  [`      borrowerPhoto:   latestLoan?.borrowerPhoto    || prefillClient?.borrowerPhoto    || "",\n      borrowerIdPhoto: latestLoan?.borrowerIdPhoto  || prefillClient?.borrowerIdPhoto  || "",`,
   `      borrowerPhoto,\n      borrowerIdPhoto,`,
   "use editable state in submit payload"],
  [`            {/* Phone — triggers returning client lookup */}`,
   `            {/* Photo documents */}\n            <div>\n              <p className="text-[10px] font-bold uppercase tracking-widest mb-3"\n                style={{ fontFamily: mono, color: t.textFaint }}>PHOTO DOCUMENTS</p>\n              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">\n                <div>\n                  <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>Passport Photo</p>\n                  <PhotoCapture value={borrowerPhoto} onChange={setBorrowerPhoto} label="Passport Photo" theme={t} facingMode="user" />\n                </div>\n                <div>\n                  <p className="text-xs mb-2 font-bold uppercase" style={labelStyle}>ID Card Photo</p>\n                  <PhotoCapture value={borrowerIdPhoto} onChange={setBorrowerIdPhoto} label="ID Card Photo" theme={t} facingMode="environment" />\n                </div>\n              </div>\n            </div>\n\n            {/* Phone — triggers returning client lookup */}`,
   "add photo UI section"],
];

for (const [find, replace, label] of steps) {
  if (src.includes(replace)) { console.log(`[skip] ${label}`); continue; }
  if (!src.includes(find)) throw new Error(`Anchor not found for "${label}"`);
  src = src.replace(find, replace);
  console.log(`[ok] ${label}`);
}

writeFileSync(path, src, "utf8");
