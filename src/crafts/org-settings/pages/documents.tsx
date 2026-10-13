import { useState } from 'react'
import { DownloadSimple, Eye, FileText, Plus } from '@phosphor-icons/react'
import { Tabs } from '@niural/components'
import { SelectField } from '@/components/nds/select-field'
import {
  I9_DOCS,
  LEGAL_DOCS,
  NEC1099S,
  ONBOARDING_DOCS,
  STATEMENTS,
  TAX_DOCS,
  TAX_FILINGS,
  W2S,
} from '@/mocks/org-settings'
import type { DocTab, FiledDoc } from '@/mocks/org-settings'
import { Card, EmptyTable, RowMenu, SectionTitle, TableCard, Td, Th, useToast } from '../ui'

const TABS: Array<{ label: string; value: DocTab }> = [
  { label: 'Tax filings', value: 'tax-filings' },
  { label: 'W-2s', value: 'w2' },
  { label: '1099s', value: '1099' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Form I-9', value: 'i9' },
  { label: 'Others', value: 'others' },
]

const FILED: Record<Exclude<DocTab, 'others'>, { title: string; periodLabel: string; rows: Array<FiledDoc> }> = {
  'tax-filings': { title: 'Payroll tax filings', periodLabel: 'Period', rows: TAX_FILINGS },
  w2: { title: 'W-2s', periodLabel: 'Tax year', rows: W2S },
  '1099': { title: '1099s', periodLabel: 'Tax year', rows: NEC1099S },
  onboarding: { title: 'Onboarding documents', periodLabel: 'Type', rows: ONBOARDING_DOCS },
  i9: { title: 'Form I-9', periodLabel: 'Documents', rows: I9_DOCS },
}

export function DocumentsPage() {
  const [tab, setTab] = useState<DocTab>('others')

  return (
    <>
      <h1 className="mb-6 text-title-h5 text-text-primary">Documents</h1>
      <Tabs variant="line" className="mb-6" tabs={TABS} value={tab} onChange={(v) => setTab(v as DocTab)} />
      {tab === 'others' ? <OthersTab /> : <FiledTab {...FILED[tab]} />}
    </>
  )
}

function DocLink({ name }: { name: string }) {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => toast(`Opened ${name}`)}
      className="inline-flex items-start gap-2 text-left text-paragraph-sm text-text-info-base underline underline-offset-2 hover:text-brand-text"
    >
      <FileText className="mt-0.5 size-4 shrink-0" />
      {name}
    </button>
  )
}

function docActions(name: string, toast: (m: string) => void) {
  return [
    { label: 'View', icon: Eye, onClick: () => toast(`Opened ${name}`) },
    { label: 'Download PDF', icon: DownloadSimple, onClick: () => toast(`Downloaded ${name}.pdf`) },
  ]
}

function FiledTab({ title, periodLabel, rows }: { title: string; periodLabel: string; rows: Array<FiledDoc> }) {
  const toast = useToast()
  return (
    <Card>
      <SectionTitle title={title} />
      <TableCard className="shadow-none ring-1 ring-border-highlight">
        <thead>
          <tr>
            <Th width="42%">Document</Th>
            <Th>{periodLabel}</Th>
            <Th>Status</Th>
            <Th width="48px" />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <Td>
                <DocLink name={d.name} />
              </Td>
              <Td className="text-text-muted">{d.period}</Td>
              <Td>{d.status}</Td>
              <Td align="right">
                <RowMenu label={d.name} actions={docActions(d.name, toast)} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </Card>
  )
}

function OthersTab() {
  const toast = useToast()
  const [year, setYear] = useState('2026')
  const statements = STATEMENTS[year] ?? []

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Tax documents" />
        <TableCard className="shadow-none ring-1 ring-border-highlight">
          <thead>
            <tr>
              <Th width="42%">Document</Th>
              <Th>Status</Th>
              <Th width="48px" />
            </tr>
          </thead>
          <tbody>
            {TAX_DOCS.map((d) => (
              <tr key={d.id}>
                <Td>
                  <DocLink name={d.name} />
                </Td>
                <Td>{d.status}</Td>
                <Td align="right">
                  <RowMenu label={d.name} actions={docActions(d.name, toast)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      </Card>

      <Card>
        <SectionTitle title="Legal documents" />
        <TableCard className="shadow-none ring-1 ring-border-highlight">
          <thead>
            <tr>
              <Th width="26%">Document</Th>
              <Th>Description</Th>
              <Th width="96px">Status</Th>
            </tr>
          </thead>
          <tbody>
            {LEGAL_DOCS.map((d) => (
              <tr key={d.id}>
                <Td>
                  <DocLink name={d.name} />
                </Td>
                <Td>{d.description}</Td>
                <Td>{d.status}</Td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      </Card>

      <Card>
        <SectionTitle
          title="Statements"
          actions={
            <div className="w-32">
              <SelectField value={year} options={Object.keys(STATEMENTS).sort().reverse()} onChange={setYear} align="end" />
            </div>
          }
        />
        <TableCard className="shadow-none ring-1 ring-border-highlight">
          <thead>
            <tr>
              <Th width="42%">Document</Th>
              <Th>Description</Th>
              <Th width="48px" />
            </tr>
          </thead>
          <tbody>
            {statements.length === 0 ? (
              <EmptyTable
                colSpan={3}
                icon={Plus}
                title={`No statements for ${year} yet`}
                description="Monthly statements appear here on the 3rd of the following month."
              />
            ) : (
              statements.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <DocLink name={s.name} />
                  </Td>
                  <Td className="text-text-muted">{s.description}</Td>
                  <Td align="right">
                    <RowMenu label={s.name} actions={docActions(s.name, toast)} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableCard>
      </Card>
    </div>
  )
}
