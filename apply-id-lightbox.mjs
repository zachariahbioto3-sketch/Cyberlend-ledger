import { readFileSync, writeFileSync } from "fs";
const path = "src/components/ClientProfilePanel.tsx";
let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const steps = [
  [`  ArrowUpRight, MapPin, Plus, Wallet, Phone, Briefcase, Clock,\n  ChevronRight, CreditCard, FileText,\n} from "lucide-react";`,
   `  ArrowUpRight, MapPin, Plus, Wallet, Phone, Briefcase, Clock,\n  ChevronRight, CreditCard, FileText, X,\n} from "lucide-react";`,
   "import X icon"],
  [`  const mono = "var(--font-mono)";\n  const today = startOfToday();`,
   `  const mono = "var(--font-mono)";\n  const today = startOfToday();\n  const [lightbox, setLightbox] = React.useState<string | null>(null);`,
   "add lightbox state"],
  [`          {client.borrowerIdPhoto ? (\n            <img\n              src={client.borrowerIdPhoto}\n              alt="ID document"\n              className="w-full h-28 object-cover rounded-xl border"\n              style={{ borderColor: t.border }}\n            />\n          ) : (`,
   `          {client.borrowerIdPhoto ? (\n            <img\n              src={client.borrowerIdPhoto}\n              alt="ID document"\n              onClick={() => setLightbox(client.borrowerIdPhoto!)}\n              className="w-full h-28 object-cover rounded-xl border cursor-zoom-in"\n              style={{ borderColor: t.border }}\n            />\n          ) : (`,
   "make ID image clickable"],
  [`      </GroupCard>\n    </div>\n  );\n};`,
   `      </GroupCard>\n\n      {lightbox && (\n        <div\n          className="fixed inset-0 z-[90] flex items-center justify-center p-6"\n          style={{ background: "rgba(10,10,12,0.92)" }}\n          onClick={() => setLightbox(null)}\n        >\n          <button\n            onClick={() => setLightbox(null)}\n            aria-label="Close"\n            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"\n            style={{ background: "rgba(255,255,255,0.1)" }}\n          >\n            <X className="w-5 h-5 text-white" />\n          </button>\n          <img\n            src={lightbox}\n            alt="ID document — full view"\n            onClick={(e) => e.stopPropagation()}\n            className="max-h-full max-w-full rounded-2xl object-contain"\n          />\n        </div>\n      )}\n    </div>\n  );\n};`,
   "add lightbox modal"],
];

for (const [find, replace, label] of steps) {
  if (src.includes(replace)) { console.log(`[skip] ${label}`); continue; }
  if (!src.includes(find)) throw new Error(`Anchor not found for "${label}"`);
  src = src.replace(find, replace);
  console.log(`[ok] ${label}`);
}

writeFileSync(path, src, "utf8");
