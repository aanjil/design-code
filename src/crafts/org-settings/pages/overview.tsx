import { useState } from 'react'
import { CheckCircle, Clock, Code, PencilSimple, SealCheck } from '@phosphor-icons/react'
import { Button, Tabs } from '@niural/components'
import { SelectField } from '@/components/nds/select-field'
import { FieldLabel } from '@/components/nds/controls'
import { COMPANY_ADDRESSES, ORG, TAXATION_STATUSES, VERIFICATION_STEPS } from '@/mocks/org-settings'
import { Avatar, Card, Field, FieldGrid, Modal, SectionTitle, Tag, mask, useReveal, useToast } from '../ui'
import { useWorld } from '../store'

export function OverviewPage() {
  const [tab, setTab] = useState<'overview' | 'verification'>('overview')

  return (
    <>
      <h1 className="mb-8 text-title-h5 text-primary">Organization</h1>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--text-base) text-(--background-base) card">
          <Code weight="bold" className="size-6" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-title-h4 text-primary">{ORG.name}</p>
            {ORG.verified && <SealCheck weight="fill" aria-label="Verified" className="size-5 text-success" />}
          </div>
          <p className="mt-1.5 text-paragraph-small text-muted">
            🇺🇸 · {ORG.city}, {ORG.country}
          </p>
        </div>
      </div>

      <Tabs
        variant="line"
        className="mt-6 mb-8"
        tabs={[
          { label: 'Overview', value: 'overview' },
          { label: 'Company verification', value: 'verification' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
      />

      {tab === 'overview' ? <OverviewTab /> : <VerificationTab />}
    </>
  )
}

function OverviewTab() {
  const { taxationStatus, setTaxationStatus } = useWorld()
  const ein = useReveal()
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle title="Company information" />
        <Card>
          <FieldGrid>
            <Field label="Legal name">{ORG.legalName}</Field>
            <Field label="Nature of business">{ORG.natureOfBusiness}</Field>
            <Field label="Country of registration">{ORG.countryOfRegistration}</Field>
            <Field label="EIN number" labelAction={ein.toggle} mono>
              {ein.shown ? ORG.ein : mask(ORG.ein)}
            </Field>
            <Field label="Registered address">{ORG.registeredAddress}</Field>
            <Field label="Date of registration" mono>
              {ORG.dateOfRegistration}
            </Field>
            <Field label="Website">
              <a href={ORG.website} target="_blank" rel="noreferrer" className="text-info hover:underline">
                {ORG.website}
              </a>
            </Field>
            <Field label="Employee count">{ORG.employeeCount}</Field>
            <Field label="Company type">{ORG.companyType}</Field>
            <Field label="Taxation status">
              <span className="inline-flex items-center gap-3">
                {taxationStatus}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-label-small text-info hover:underline"
                >
                  <PencilSimple className="size-4" />
                  Edit
                </button>
              </span>
            </Field>
          </FieldGrid>
        </Card>
      </section>

      <section>
        <SectionTitle title="Company admin" />
        <Card className="flex items-center gap-3">
          <Avatar name={ORG.admin.name} size="lg" />
          <div>
            <p className="text-label-medium text-primary">{ORG.admin.name}</p>
            <p className="text-paragraph-xsmall text-muted">{ORG.admin.email}</p>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle title="Company address" />
        <Card className="py-1">
          {COMPANY_ADDRESSES.map((a, i) => (
            <div key={a.id} className={i > 0 ? 'border-t border-base py-3' : 'py-3'}>
              <p className="text-label-small text-primary">{a.line}</p>
              <p className="text-caption-sm text-muted">{a.kind}</p>
            </div>
          ))}
        </Card>
      </section>

      {editing && (
        <TaxationStatusModal
          current={taxationStatus}
          onClose={() => setEditing(false)}
          onSave={(v) => {
            setTaxationStatus(v)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

function TaxationStatusModal({
  current,
  onClose,
  onSave,
}: {
  current: string
  onClose: () => void
  onSave: (value: string) => void
}) {
  const [value, setValue] = useState(current)
  const toast = useToast()
  return (
    <Modal
      title="Edit taxation status"
      subtitle="How the IRS taxes your LLC. This changes which federal forms we file for you."
      onClose={onClose}
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={value === current}
            onClick={() => {
              onSave(value)
              toast('Taxation status updated')
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel>Taxation status</FieldLabel>
        <SelectField value={value} options={TAXATION_STATUSES} onChange={setValue} />
      </div>
      {value !== current && (
        <p className="rounded-lg border border-warning-muted bg-warning-highlight px-3 py-2 text-paragraph-xsmall text-warning">
          Electing {value} needs Form {value === 'S Corporation' ? '2553' : '8832'} on file. We'll prepare it for signature in
          Documents.
        </p>
      )}
    </Modal>
  )
}

function VerificationTab() {
  const verified = VERIFICATION_STEPS.filter((s) => s.status === 'verified').length
  return (
    <section>
      <SectionTitle
        title="Company verification"
        subtitle={`${verified} of ${VERIFICATION_STEPS.length} checks complete - your account can run payroll and move money.`}
        actions={<Tag tone="success">Verified</Tag>}
      />
      <Card className="py-1">
        {VERIFICATION_STEPS.map((s, i) => (
          <div key={s.id} className={i > 0 ? 'flex items-start gap-3 border-t border-base py-3' : 'flex items-start gap-3 py-3'}>
            {s.status === 'verified' ? (
              <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-success" />
            ) : (
              <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-label-small text-primary">{s.label}</p>
              <p className="text-paragraph-xsmall text-muted">{s.detail}</p>
            </div>
            {s.date && <span className="shrink-0 tabular-nums text-paragraph-xsmall text-muted">{s.date}</span>}
          </div>
        ))}
      </Card>
    </section>
  )
}
