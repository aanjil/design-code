import { useState } from 'react'
import { CheckCircle, Warning } from '@phosphor-icons/react'
import { Button } from '@niural/components'
import { FieldLabel, TextInput } from '@/components/nds/controls'
import type { IdentityProvider } from '@/mocks/org-settings'
import { Card, Modal, SectionTitle, Tag, useToast } from '../ui'
import { useWorld } from '../store'

/** Brand marks drawn as simple glyphs - the real logos are product assets. */
function ProviderMark({ id }: { id: IdentityProvider['id'] }) {
  const letter = { jumpcloud: 'J', okta: 'O', google: 'G' }[id]
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-base text-label-medium text-primary borders-base">
      {letter}
    </span>
  )
}

export function SecurityPage() {
  const { idps, setIdps } = useWorld()
  const toast = useToast()
  const [configuring, setConfiguring] = useState<IdentityProvider | null>(null)
  const active = idps.find((p) => p.configured)

  return (
    <>
      <h1 className="mb-8 text-title-h5 text-primary">Security</h1>

      <SectionTitle title="Identity providers" subtitle="Configure identity providers that allow users to sign in with Single Sign-On (SSO)." />

      {active ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-success-muted bg-success-highlight px-3 py-2.5 text-label-small text-success">
          <CheckCircle weight="fill" className="size-4 shrink-0" />
          SSO is on - users at {active.domain} sign in with {active.name}.
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-warning-muted bg-warning-highlight px-3 py-2.5 text-label-small text-warning">
          <Warning weight="fill" className="size-4 shrink-0" />
          Configure an identity provider to enable Single Sign-On.
        </div>
      )}

      <div className="space-y-3">
        {idps.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 py-3.5">
            <ProviderMark id={p.id} />
            <p className="text-label-medium text-primary">{p.name}</p>
            {p.configured ? <Tag tone="success">Configured</Tag> : <Tag>Not configured</Tag>}
            {p.configured && <span className="text-paragraph-xsmall text-muted">{p.domain}</span>}
            <div className="flex-1" />
            {p.configured ? (
              <Button
                variant="outline"
                shade="error"
                size="sm"
                onClick={() => {
                  setIdps((all) => all.map((x) => (x.id === p.id ? { ...x, configured: false, domain: undefined } : x)))
                  toast(`${p.name} SSO disabled`)
                }}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="outline"
                shade="neutral"
                size="sm"
                disabled={!!active}
                title={active ? `Disable ${active.name} first - one provider at a time` : undefined}
                onClick={() => setConfiguring(p)}
              >
                Configure
              </Button>
            )}
          </Card>
        ))}
      </div>

      {configuring && (
        <ConfigureModal
          provider={configuring}
          onClose={() => setConfiguring(null)}
          onSave={(domain) => {
            setIdps((all) => all.map((x) => (x.id === configuring.id ? { ...x, configured: true, domain } : x)))
            toast(`${configuring.name} SSO enabled`)
            setConfiguring(null)
          }}
        />
      )}
    </>
  )
}

function ConfigureModal({
  provider,
  onClose,
  onSave,
}: {
  provider: IdentityProvider
  onClose: () => void
  onSave: (domain: string) => void
}) {
  const [domain, setDomain] = useState('anjilcrafts.com')
  const [clientId, setClientId] = useState('')
  const [metadata, setMetadata] = useState('')
  const valid = domain.trim() && clientId.trim() && /^https:\/\//.test(metadata.trim())

  return (
    <Modal
      title={`Configure ${provider.name}`}
      subtitle="Paste these from your provider's SAML app. Existing sessions stay signed in."
      onClose={onClose}
      width="w-[520px]"
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!valid} onClick={() => onSave(domain.trim())}>
            Enable SSO
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel htmlFor="sso-domain" required>
          Email domain
        </FieldLabel>
        <TextInput id="sso-domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="sso-client" required>
          Client ID
        </FieldLabel>
        <TextInput id="sso-client" value={clientId} placeholder="0oa8f2k1x9…" className="font-mono text-label-small" onChange={(e) => setClientId(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="sso-meta" required>
          SAML metadata URL
        </FieldLabel>
        <TextInput
          id="sso-meta"
          value={metadata}
          placeholder="https://…/sso/saml/metadata"
          onChange={(e) => setMetadata(e.target.value)}
        />
      </div>
      <div className="rounded-lg bg-highlight px-3 py-2">
        <p className="text-caption-sm font-medium text-muted">ACS URL to paste into {provider.name}</p>
        <p className="font-mono text-paragraph-xsmall text-primary">https://app.niural.com/sso/acs/anjil-crafts</p>
      </div>
    </Modal>
  )
}
