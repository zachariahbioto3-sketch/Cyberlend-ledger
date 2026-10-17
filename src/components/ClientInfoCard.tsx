import * as React from "react"
import { Edit3, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input, fieldClassName, fieldViewClassName } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loan, ClientFlag } from "../types"

type FlagMeta = { color: string; bg: string; border: string; icon: React.ReactNode }
type FieldDef = { key: keyof Loan; label: string; type?: string; placeholder?: string; readOnly?: boolean; wide?: boolean }

const IDENTITY: FieldDef[] = [
  { key: "borrowerName",     label: "Full name",  placeholder: "Full name", wide: true },
  { key: "borrowerPhone",    label: "Phone",      type: "tel", placeholder: "07XX XXX XXX" },
  { key: "borrowerIdNumber", label: "ID number",  placeholder: "National ID number" },
  { key: "borrowerEmail",    label: "Email",      type: "email", placeholder: "name@example.com", wide: true },
]

const DETAILS: FieldDef[] = [
  { key: "borrowerAddress",  label: "Address",         placeholder: "Town, estate or street", wide: true },
  { key: "kraPin",           label: "KRA PIN",         placeholder: "A000000000X" },
  { key: "occupation",       label: "Occupation",      placeholder: "What the client does" },
  { key: "referralSource",   label: "Referral source", placeholder: "Who referred them" },
  { key: "loanPurpose",      label: "Loan purpose",    readOnly: true },
]

interface ClientInfoCardProps {
  client: Loan
  editMode: boolean
  editData: Partial<Loan>
  onChange: (key: keyof Loan, value: string) => void
  onToggleFlag: (flag: ClientFlag) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  flagMeta: Record<ClientFlag, FlagMeta>
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-foreground/10 p-3 sm:p-4">
      <p className="mb-3 text-xs font-medium text-muted-fg">{title}</p>
      {children}
    </div>
  )
}

function FieldGrid({ defs, source, editMode, onChange }: {
  defs: FieldDef[]
  source: Record<string, unknown>
  editMode: boolean
  onChange: (key: keyof Loan, value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {defs.map((d) => {
        const active = editMode && !d.readOnly
        const id = "client-" + String(d.key)
        return (
          <div key={String(d.key)} className={cn("flex flex-col gap-1.5", d.wide && "col-span-2")}>
            <label htmlFor={id} className="text-xs font-medium text-muted-fg">{d.label}</label>
            <Input
              id={id}
              type={d.type || "text"}
              value={String(source[d.key as string] ?? "")}
              readOnly={!active}
              tabIndex={active ? 0 : -1}
              placeholder={active ? d.placeholder : "Not set"}
              onChange={(e) => onChange(d.key, e.target.value)}
              className={active ? fieldClassName : fieldViewClassName}
            />
          </div>
        )
      })}
    </div>
  )
}

export const ClientInfoCard: React.FC<ClientInfoCardProps> = ({
  client, editMode, editData, onChange, onToggleFlag, onEdit, onCancel, onSave, flagMeta,
}) => {
  const source = (editMode ? editData : client) as Record<string, unknown>
  const flags = ((editMode ? editData.clientFlags : client.clientFlags) || []) as ClientFlag[]
  const allFlags = Object.keys(flagMeta) as ClientFlag[]
  const shownFlags = editMode ? allFlags : flags

  return (
    <div className="rounded-xl border border-foreground/10 bg-card text-card-fg">
      <div className="flex items-start justify-between gap-3 border-b border-foreground/10 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-semibold leading-tight">Client information</h3>
          <p className="mt-1 text-xs text-muted-fg">
            {editMode ? "Changes apply to every loan for this client" : "Contact and profile details"}
          </p>
        </div>
        {!editMode && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="h-3.5 w-3.5" />Edit
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3 sm:p-4">
        <Group title="Identity">
          <FieldGrid defs={IDENTITY} source={source} editMode={editMode} onChange={onChange} />
        </Group>

        <Group title="Details">
          <FieldGrid defs={DETAILS} source={source} editMode={editMode} onChange={onChange} />
        </Group>

        <Group title="Notes">
          <textarea
            id="client-notes"
            rows={3}
            readOnly={!editMode}
            tabIndex={editMode ? 0 : -1}
            value={String(source.clientNotes ?? "")}
            placeholder={editMode ? "Add notes about this client" : "No notes"}
            onChange={(e) => onChange("clientNotes", e.target.value)}
            className={cn(editMode ? fieldClassName : fieldViewClassName, "min-h-20 resize-none py-2")}
          />
        </Group>

        <Group title="Flags">
          {shownFlags.length === 0 ? (
            <p className="text-sm text-muted-fg">No flags</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {shownFlags.map((f) => {
                const m = flagMeta[f]
                const on = flags.includes(f)
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { if (editMode) onToggleFlag(f) }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                      editMode ? "cursor-pointer" : "cursor-default",
                      !on && "border-foreground/15 text-muted-fg"
                    )}
                    style={on ? { background: m.bg, borderColor: m.border, color: m.color } : undefined}
                  >
                    {m.icon}{f}
                  </button>
                )
              })}
            </div>
          )}
        </Group>
      </div>

      {editMode && (
        <div className="flex items-center justify-end gap-2 border-t border-foreground/10 px-4 py-3 sm:px-5">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="button" size="sm" onClick={onSave}><Save className="h-3.5 w-3.5" />Save changes</Button>
        </div>
      )}
    </div>
  )
}