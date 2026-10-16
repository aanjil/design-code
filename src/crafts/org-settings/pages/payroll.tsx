import { useState } from 'react'
import { ArrowCounterClockwise, CalendarCheck, Coins, Hash, PencilSimple, Plus, Prohibit } from '@phosphor-icons/react'
import { Button, Switch, Tabs } from '@niural/components'
import { FieldLabel, TextInput } from '@/components/nds/controls'
import type { CustomEarning } from '@/mocks/org-settings'
import { Card, Modal, RowMenu, SectionTitle, Tag, useToast } from '../ui'
import { newId, useWorld } from '../store'

export function PayrollPage() {
  const { earnings, setEarnings } = useWorld()
  const toast = useToast()
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [modal, setModal] = useState<{ earning?: CustomEarning } | null>(null)
  const rows = earnings.filter((e) => e.active === (status === 'active'))

  const setActive = (e: CustomEarning, active: boolean) => {
    setEarnings((all) => all.map((x) => (x.id === e.id ? { ...x, active } : x)))
    toast(`${e.name} ${active ? 'reactivated' : 'deactivated'}`)
  }

  return (
    <>
      <h1 className="mb-8 text-title-h5 text-primary">Payroll</h1>

      <Card className="mb-12 flex items-center gap-6 p-6">
        <div className="min-w-0 flex-1">
          <p className="text-label-large text-primary">Customize your workers' pay</p>
          <p className="mt-1.5 text-paragraph-small text-muted">
            Set up the foundations for your payroll by managing payroll schedules, custom earnings and job codes.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {[CalendarCheck, Coins, Hash].map((Glyph, i) => (
            <span key={i} className="flex size-10 items-center justify-center rounded-xl bg-highlight text-brand">
              <Glyph className="size-5" />
            </span>
          ))}
        </div>
      </Card>

      <h2 className="mb-6 text-title-h5 text-primary">Earnings</h2>

      <SectionTitle
        title="Custom earnings"
        subtitle="Custom earnings are additional earnings and are subject to standard payroll tax withholdings."
        actions={
          <>
            <Tabs
              variant="segmented"
              tabs={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              value={status}
              onChange={(v) => setStatus(v as typeof status)}
            />
            <Button variant="ghost" size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setModal({})}>
              New custom earning
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        {rows.length === 0 && (
          <Card className="py-8 text-center">
            <p className="text-label-small text-primary">No {status} custom earnings</p>
            <p className="text-paragraph-xsmall text-muted">
              {status === 'active' ? 'Add bonuses, stipends or differentials your team gets paid.' : 'Deactivated earnings show up here.'}
            </p>
          </Card>
        )}
        {rows.map((e) => (
          <Card key={e.id} className="flex items-center gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-label-small text-primary">{e.name}</p>
              <p className="text-caption-sm text-muted">{e.description}</p>
            </div>
            <span className="text-paragraph-small text-muted">Include in overtime pay:</span>
            <Tag tone={e.overtime ? 'success' : 'neutral'} className="w-10 justify-center">
              {e.overtime ? 'Yes' : 'No'}
            </Tag>
            <RowMenu
              label={e.name}
              actions={
                e.active
                  ? [
                      { label: 'Edit earning', icon: PencilSimple, onClick: () => setModal({ earning: e }) },
                      { label: 'Deactivate', icon: Prohibit, destructive: true, onClick: () => setActive(e, false) },
                    ]
                  : [{ label: 'Reactivate', icon: ArrowCounterClockwise, onClick: () => setActive(e, true) }]
              }
            />
          </Card>
        ))}
      </div>

      {modal && (
        <EarningModal
          earning={modal.earning}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            if (modal.earning) {
              const id = modal.earning.id
              setEarnings((all) => all.map((x) => (x.id === id ? { ...x, ...draft } : x)))
              toast('Custom earning updated')
            } else {
              setEarnings((all) => [...all, { id: newId('ce'), ...draft, active: true }])
              setStatus('active')
              toast(`${draft.name} added`)
            }
            setModal(null)
          }}
        />
      )}
    </>
  )
}

function EarningModal({
  earning,
  onClose,
  onSave,
}: {
  earning?: CustomEarning
  onClose: () => void
  onSave: (draft: Pick<CustomEarning, 'name' | 'description' | 'overtime'>) => void
}) {
  const [name, setName] = useState(earning?.name ?? '')
  const [description, setDescription] = useState(earning?.description ?? '')
  const [overtime, setOvertime] = useState(earning?.overtime ?? false)

  return (
    <Modal
      title={earning ? 'Edit custom earning' : 'New custom earning'}
      subtitle="Taxed as regular wages unless your tax advisor says otherwise."
      onClose={onClose}
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), description: description.trim(), overtime })}>
            {earning ? 'Save' : 'Add earning'}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel htmlFor="ce-name" required>
          Earning name
        </FieldLabel>
        <TextInput id="ce-name" autoFocus value={name} placeholder="e.g. Holiday bonus" onChange={(e) => setName(e.target.value)} />
        <p className="text-caption-sm text-muted">Shows on pay stubs exactly as written.</p>
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="ce-desc">Description</FieldLabel>
        <TextInput id="ce-desc" value={description} placeholder="Internal note for admins" onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex items-start justify-between gap-4 rounded-lg bg-highlight px-3 py-2.5">
        <div>
          <p className="text-label-small text-primary">Include in overtime pay</p>
          <p className="text-paragraph-xsmall text-muted">Counts toward the regular rate when overtime is calculated (FLSA).</p>
        </div>
        <Switch isChecked={overtime} onChange={setOvertime} size="small" disableInternalStateManagement />
      </div>
    </Modal>
  )
}
