import { useState } from 'react'
import { MapPin } from '@phosphor-icons/react'
import { Button } from '@niural/components'
import { FieldLabel, TextInput } from '@/components/nds/controls'
import { SelectField } from '@/components/nds/select-field'
import { FEDERAL_TAX, REGISTERABLE_STATES } from '@/mocks/org-settings'
import type { StateTaxSetup } from '@/mocks/org-settings'
import { Card, Dash, Field, FieldGrid, Modal, SectionTitle, Tag, mask, useReveal, useToast } from '../ui'
import { useWorld } from '../store'

export function TaxSetupPage() {
  const { stateTax, setStateTax } = useWorld()
  const ein = useReveal()
  const [editing, setEditing] = useState<StateTaxSetup | null>(null)
  const [registering, setRegistering] = useState(false)

  return (
    <>
      <h1 className="mb-8 text-title-h5 text-text-primary">Tax Setup</h1>

      <Card className="mb-12 flex items-center gap-6 p-6">
        <div className="min-w-0 flex-1">
          <p className="text-label-lg text-text-primary">Hiring in a new state? Let Niural handle your registrations.</p>
          <p className="mt-1.5 text-paragraph-sm text-text-muted">
            Niural registers your business with state tax agencies so you can start payroll without delay. No paperwork, no
            back-and-forth with agencies, and no risk of missed deadlines.
          </p>
          <Button variant="solid" shade="neutral" size="sm" className="mt-4" onClick={() => setRegistering(true)}>
            Let Niural register for you
          </Button>
        </div>
        <StatesGlyph count={stateTax.length} />
      </Card>

      <section className="mb-12">
        <SectionTitle
          title="Federal Tax Setup"
          subtitle="You can find this info on your FEIN assignment form (Form CP575). We need this to file and pay your taxes correctly."
        />
        <Card>
          <FieldGrid>
            <Field label="Federal EIN" labelAction={ein.toggle} mono>
              {ein.shown ? FEDERAL_TAX.ein : mask(FEDERAL_TAX.ein)}
            </Field>
            <Field label="Company type">{FEDERAL_TAX.companyType}</Field>
            <Field label="Deposit schedule">{FEDERAL_TAX.depositSchedule}</Field>
            <Field label="Federal filing form" mono>
              {FEDERAL_TAX.filingForm}
            </Field>
          </FieldGrid>
        </Card>
      </section>

      <div className="space-y-12">
        {stateTax.map((s) => (
          <section key={s.code}>
            <SectionTitle
              title={`${s.state} State tax setup`}
              subtitle={<StateStatusLine setup={s} />}
              actions={
                s.status !== 'registering' && (
                  <Button variant="solid" shade="neutral" size="sm" onClick={() => setEditing(s)}>
                    Edit
                  </Button>
                )
              }
            />
            <Card>
              {s.status === 'registering' ? (
                <p className="text-paragraph-sm text-text-muted">
                  We're registering {s.state} withholding and unemployment accounts. Agency numbers usually arrive in 2–3 weeks;
                  we'll fill them in here and email you.
                </p>
              ) : (
                <FieldGrid>
                  {s.fields.map((f) => (
                    <Field key={f.key} label={f.label} mono={f.mono && !!f.value}>
                      {f.value || <Dash />}
                    </Field>
                  ))}
                </FieldGrid>
              )}
            </Card>
          </section>
        ))}
      </div>

      {editing && (
        <EditStateModal
          setup={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setStateTax((all) => all.map((s) => (s.code === next.code ? next : s)))
            setEditing(null)
          }}
        />
      )}
      {registering && (
        <RegisterStateModal
          taken={stateTax.map((s) => s.state)}
          onClose={() => setRegistering(false)}
          onRegister={(state) => {
            setStateTax((all) => [...all, { code: state.slice(0, 2).toUpperCase(), state, status: 'registering', fields: [] }])
            setRegistering(false)
          }}
        />
      )}
    </>
  )
}

function StateStatusLine({ setup }: { setup: StateTaxSetup }) {
  if (setup.status === 'registering') return <Tag tone="info" className="mt-1">Registration in progress</Tag>
  const missing = setup.fields.filter((f) => !f.value).length
  if (missing > 0)
    return (
      <span className="text-text-warning-base">
        {missing} {missing === 1 ? 'field' : 'fields'} missing - payroll in {setup.state} is blocked until these are added.
      </span>
    )
  return 'All agency accounts on file.'
}

function StatesGlyph({ count }: { count: number }) {
  return (
    <div className="relative hidden h-28 w-44 shrink-0 items-center justify-center rounded-xl bg-background-highlight sm:flex">
      <MapPin weight="fill" className="absolute top-5 left-10 size-5 text-text-success-base" />
      <MapPin weight="fill" className="absolute right-8 bottom-6 size-5 text-text-success-base" />
      <MapPin weight="fill" className="absolute top-9 right-14 size-4 text-brand-primary" />
      <span className="absolute bottom-3 left-4 font-mono text-mono-xs text-text-muted">{count} states</span>
    </div>
  )
}

function EditStateModal({
  setup,
  onClose,
  onSave,
}: {
  setup: StateTaxSetup
  onClose: () => void
  onSave: (next: StateTaxSetup) => void
}) {
  const toast = useToast()
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(setup.fields.map((f) => [f.key, f.value])))
  const complete = setup.fields.every((f) => values[f.key]?.trim())

  return (
    <Modal
      title={`${setup.state} tax setup`}
      subtitle="Numbers come from your state agency registration letters."
      onClose={onClose}
      width="w-[520px]"
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave({
                ...setup,
                status: complete ? 'active' : 'incomplete',
                fields: setup.fields.map((f) => ({ ...f, value: values[f.key]?.trim() ?? '' })),
              })
              toast(`${setup.state} tax setup saved`)
            }}
          >
            Save
          </Button>
        </>
      }
    >
      {setup.fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <FieldLabel htmlFor={`tax-${f.key}`}>{f.label}</FieldLabel>
          <TextInput
            id={`tax-${f.key}`}
            value={values[f.key] ?? ''}
            placeholder="Not provided yet"
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className={f.mono ? 'font-mono text-mono-sm' : undefined}
          />
        </div>
      ))}
    </Modal>
  )
}

function RegisterStateModal({
  taken,
  onClose,
  onRegister,
}: {
  taken: Array<string>
  onClose: () => void
  onRegister: (state: string) => void
}) {
  const toast = useToast()
  const options = REGISTERABLE_STATES.filter((s) => !taken.includes(s))
  const [state, setState] = useState<string | null>(null)

  return (
    <Modal
      title="Register in a new state"
      subtitle="We file withholding and unemployment registrations with the state on your behalf."
      onClose={onClose}
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!state}
            onClick={() => {
              if (!state) return
              onRegister(state)
              toast(`Registration started for ${state}`)
            }}
          >
            Start registration
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel>State</FieldLabel>
        <SelectField value={state} options={options} onChange={setState} placeholder="Select a state" />
      </div>
      <p className="text-paragraph-xs text-text-muted">
        Usually takes 2–3 weeks. You can run payroll in other states meanwhile.
      </p>
    </Modal>
  )
}
