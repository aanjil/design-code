import { useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  EnvelopeSimple,
  PencilSimple,
  Prohibit,
  Trash,
  UserPlus,
  Users as UsersIcon,
} from '@phosphor-icons/react'
import { Button, Tabs } from '@niural/components'
import { FieldLabel, SearchField, TextInput, ToolbarIconButton } from '@/components/nds/controls'
import { USER_ROLES } from '@/mocks/org-settings'
import type { OrgUser, UserRole, UserStatus } from '@/mocks/org-settings'
import {
  Avatar,
  EmptyTable,
  Modal,
  PageTitle,
  Pagination,
  RowMenu,
  TableCard,
  Tag,
  Td,
  Th,
  usePaging,
  useToast,
} from '../ui'
import type { RowAction, TagTone } from '../ui'
import { TODAY_LABEL, newId, useWorld } from '../store'
import { cn } from '@/lib/utils'

const ROLE_TONE: Record<UserRole, TagTone> = {
  'Org owner': 'neutral',
  'Entity admin': 'error',
  'Entity viewer': 'pink',
  'People manager': 'teal',
  'Payroll admin': 'brand',
  'Finance approver': 'orange',
}

const TABS: Array<{ label: string; value: UserStatus }> = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending invitation', value: 'pending' },
  { label: 'Unassigned', value: 'unassigned' },
]

const EMPTY_COPY: Record<UserStatus, string> = {
  active: 'No active users match your search.',
  inactive: 'Deactivated users show up here. They keep their history but lose access.',
  pending: 'Invites waiting to be accepted show up here.',
  unassigned: 'Everyone has a role - nice.',
}

export function UsersPage() {
  const { users, setUsers } = useWorld()
  const toast = useToast()
  const [tab, setTab] = useState<UserStatus>('active')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; user: OrgUser } | null>(null)

  const counts = useMemo(() => {
    const c: Record<UserStatus, number> = { active: 0, inactive: 0, pending: 0, unassigned: 0 }
    for (const u of users) c[u.status] += 1
    return c
  }, [users])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) => u.status === tab && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roles.some((r) => r.toLowerCase().includes(q))),
    )
  }, [users, tab, query])
  const paging = usePaging(rows, 100)

  const update = (id: string, patch: Partial<OrgUser>) => setUsers((all) => all.map((u) => (u.id === id ? { ...u, ...patch } : u)))

  function actionsFor(u: OrgUser): Array<RowAction> {
    if (u.roles.includes('Org owner')) return [{ label: 'Edit roles', icon: PencilSimple, onClick: () => toast('The org owner always keeps full access') }]
    switch (u.status) {
      case 'active':
        return [
          { label: 'Edit roles', icon: PencilSimple, onClick: () => setModal({ mode: 'edit', user: u }) },
          {
            label: 'Deactivate',
            icon: Prohibit,
            destructive: true,
            onClick: () => {
              update(u.id, { status: 'inactive', since: TODAY_LABEL })
              toast(`${u.name} deactivated`)
            },
          },
        ]
      case 'inactive':
        return [
          {
            label: 'Reactivate',
            icon: ArrowCounterClockwise,
            onClick: () => {
              update(u.id, { status: u.roles.length ? 'active' : 'unassigned', since: undefined })
              toast(`${u.name} reactivated`)
            },
          },
        ]
      case 'pending':
        return [
          { label: 'Resend invite', icon: EnvelopeSimple, onClick: () => { update(u.id, { since: TODAY_LABEL }); toast(`Invite resent to ${u.email}`) } },
          {
            label: 'Revoke invite',
            icon: Trash,
            destructive: true,
            onClick: () => {
              setUsers((all) => all.filter((x) => x.id !== u.id))
              toast('Invite revoked')
            },
          },
        ]
      case 'unassigned':
        return [{ label: 'Assign roles', icon: PencilSimple, onClick: () => setModal({ mode: 'edit', user: u }) }]
    }
  }

  return (
    <>
      <PageTitle
        title="Users"
        actions={
          <Button size="sm" leftIcon={<UserPlus className="size-4" />} onClick={() => setModal({ mode: 'add' })}>
            Add user
          </Button>
        }
      />

      <Tabs
        variant="line"
        className="mb-4"
        tabs={TABS.map((t) => ({
          ...t,
          rightElement: counts[t.value] > 0 && t.value !== 'active' ? <CountBadge n={counts[t.value]} /> : undefined,
        }))}
        value={tab}
        onChange={(v) => setTab(v as UserStatus)}
      />

      <div className="mb-3 flex items-center gap-2">
        <SearchField value={query} onChange={setQuery} placeholder="Search name, email or role" showKbd={false} />
        <ToolbarIconButton label="Refresh" onClick={() => toast('Users are up to date')}>
          <ArrowClockwise className="size-4" />
        </ToolbarIconButton>
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th width="28%">Name</Th>
            <Th width="36%">Role</Th>
            <Th>Email</Th>
            <Th width="48px" />
          </tr>
        </thead>
        <tbody>
          {paging.visible.length === 0 ? (
            <EmptyTable colSpan={4} icon={UsersIcon} title="No users here" description={EMPTY_COPY[tab]} />
          ) : (
            paging.visible.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-background-highlight">
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={u.name} />
                    <span className="min-w-0">
                      <span className="block text-label-sm">{u.name}</span>
                      {u.since && (
                        <span className="block text-caption text-text-muted">
                          {u.status === 'pending' ? 'Invited' : 'Deactivated'} {u.since}
                        </span>
                      )}
                    </span>
                  </span>
                </Td>
                <Td>
                  <RoleTags roles={u.roles} />
                </Td>
                <Td className="text-label-sm">{u.email}</Td>
                <Td align="right">
                  <RowMenu label={u.name} actions={actionsFor(u)} />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
      <Pagination {...paging.props} />

      {modal && (
        <UserModal
          user={modal.mode === 'edit' ? modal.user : undefined}
          takenEmails={users.map((u) => u.email.toLowerCase())}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            if (modal.mode === 'edit') {
              update(modal.user.id, { roles: draft.roles, status: modal.user.status === 'unassigned' && draft.roles.length ? 'active' : modal.user.status })
              toast(`Roles updated for ${modal.user.name}`)
            } else {
              setUsers((all) => [...all, { id: newId('u'), name: draft.name, email: draft.email, roles: draft.roles, status: 'pending', since: TODAY_LABEL }])
              setTab('pending')
              toast(`Invite sent to ${draft.email}`)
            }
            setModal(null)
          }}
        />
      )}
    </>
  )
}

function CountBadge({ n }: { n: number }) {
  return <span className="ml-1.5 rounded-full bg-background-highlight px-1.5 font-mono text-mono-xs text-text-muted">{n}</span>
}

/** Two tags, then a +N chip whose tooltip lists the rest - matches the screenshot. */
function RoleTags({ roles }: { roles: Array<UserRole> }) {
  if (roles.length === 0) return <span className="text-paragraph-sm text-text-muted">No role</span>
  const shown = roles.slice(0, 2)
  const rest = roles.slice(2)
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((r) => (
        <Tag key={r} tone={ROLE_TONE[r]}>
          {r}
        </Tag>
      ))}
      {rest.length > 0 && (
        <span
          title={rest.join(', ')}
          className="inline-flex h-6 items-center rounded-full bg-background-base px-2 font-mono text-mono-xs text-text-primary shadow-button-gray"
        >
          +{rest.length}
        </span>
      )}
    </span>
  )
}

function UserModal({
  user,
  takenEmails,
  onClose,
  onSave,
}: {
  user?: OrgUser
  takenEmails: Array<string>
  onClose: () => void
  onSave: (draft: { name: string; email: string; roles: Array<UserRole> }) => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [roles, setRoles] = useState<Array<UserRole>>(user?.roles ?? [])
  const [touched, setTouched] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const emailTaken = !user && takenEmails.includes(email.trim().toLowerCase())
  const emailError = touched && (!emailValid ? 'Enter a valid email' : emailTaken ? 'This person already has access' : null)
  const valid = name.trim() && emailValid && !emailTaken && roles.length > 0

  return (
    <Modal
      title={user ? `Edit roles - ${user.name}` : 'Add user'}
      subtitle={user ? undefined : "They'll get an email invite to set up their Niural login."}
      onClose={onClose}
      width="w-[520px]"
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => onSave({ name: name.trim(), email: email.trim(), roles })}
          >
            {user ? 'Save roles' : 'Send invite'}
          </Button>
        </>
      }
    >
      {!user && (
        <>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="user-name" required>
              Full name
            </FieldLabel>
            <TextInput id="user-name" value={name} autoFocus placeholder="Priya Raman" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="user-email" required>
              Work email
            </FieldLabel>
            <TextInput
              id="user-email"
              type="email"
              value={email}
              placeholder="name@anjilcrafts.com"
              invalid={!!emailError}
              onBlur={() => setTouched(true)}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <p className="text-caption text-text-error-base">{emailError}</p>}
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <FieldLabel required>Roles</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {USER_ROLES.map((r) => {
            const on = roles.includes(r)
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => setRoles((all) => (on ? all.filter((x) => x !== r) : [...all, r]))}
                className={cn(
                  'h-8 rounded-full px-3 text-label-sm transition-colors',
                  on ? 'bg-brand-muted text-brand-text shadow-border-brand' : 'bg-background-base text-text-primary shadow-button-gray hover:bg-background-highlight',
                )}
              >
                {r}
              </button>
            )
          })}
        </div>
        <p className="text-caption text-text-muted">Roles stack - a People manager who is also a Payroll admin gets both.</p>
      </div>
    </Modal>
  )
}
