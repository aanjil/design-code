import { useMemo, useState } from 'react'
import { ArrowClockwise, Cube, PencilSimple, Plus, Trash, UsersFour } from '@phosphor-icons/react'
import { Button } from '@niural/components'
import { FieldLabel, SearchField, TextArea, TextInput, ToolbarIconButton } from '@/components/nds/controls'
import type { OrgGroup } from '@/mocks/org-settings'
import { EmptyTable, Modal, PageTitle, Pagination, RowMenu, TableCard, Td, Th, usePaging, useToast } from '../ui'
import { TODAY_ISO, newId, useWorld } from '../store'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'members' | 'updated'

const TONE_BG: Record<OrgGroup['tone'], string> = {
  teal: 'bg-accent-teal-highlight text-accent-teal-base',
  violet: 'bg-accent-violet-highlight text-accent-violet-base',
  orange: 'bg-accent-orange-highlight text-accent-orange-base',
  pink: 'bg-accent-pink-highlight text-accent-pink-base',
}
const TONES = Object.keys(TONE_BG) as Array<OrgGroup['tone']>

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function GroupsPage() {
  const { groups, setGroups } = useWorld()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'updated', dir: 'desc' })
  const [modal, setModal] = useState<{ group?: OrgGroup } | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = groups.filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sort.key === 'members') return (a.members - b.members) * sign
      return a[sort.key].localeCompare(b[sort.key]) * sign
    })
  }, [groups, query, sort])
  const paging = usePaging(rows, 100)

  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  const sorted = (key: SortKey) => (sort.key === key ? sort.dir : null)

  return (
    <>
      <PageTitle title="Groups" subtitle="Manage worker collections for organizational access and reporting." divider />

      <div className="mb-3 flex items-center gap-2">
        <SearchField value={query} onChange={setQuery} showKbd={false} />
        <ToolbarIconButton label="Refresh" onClick={() => toast('Groups are up to date')}>
          <ArrowClockwise className="size-4" />
        </ToolbarIconButton>
        <div className="flex-1" />
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setModal({})}>
          Create group
        </Button>
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th width="30%" onSort={() => sortBy('name')} sorted={sorted('name')}>
              Group name
            </Th>
            <Th>Description</Th>
            <Th width="110px" onSort={() => sortBy('members')} sorted={sorted('members')}>
              Members
            </Th>
            <Th width="150px" onSort={() => sortBy('updated')} sorted={sorted('updated')}>
              Last updated at
            </Th>
            <Th width="48px" />
          </tr>
        </thead>
        <tbody>
          {paging.visible.length === 0 ? (
            <EmptyTable
              colSpan={5}
              icon={UsersFour}
              title={query ? 'No groups match your search' : 'No groups yet'}
              description="Groups bundle workers for access rules, approvals and reporting."
              action={
                !query && (
                  <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setModal({})}>
                    Create group
                  </Button>
                )
              }
            />
          ) : (
            paging.visible.map((g) => (
              <tr key={g.id} className="transition-colors hover:bg-highlight">
                <Td>
                  <span className="flex items-center gap-2.5">
                    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', TONE_BG[g.tone])}>
                      <Cube weight="fill" className="size-3.5" />
                    </span>
                    <span className="text-label-small">{g.name}</span>
                  </span>
                </Td>
                <Td>
                  <span className="line-clamp-2">{g.description}</span>
                </Td>
                <Td className="tabular-nums text-label-small">{g.members}</Td>
                <Td className="tabular-nums text-label-small">{fmtDate(g.updated)}</Td>
                <Td align="right">
                  <RowMenu
                    label={g.name}
                    actions={[
                      { label: 'Edit group', icon: PencilSimple, onClick: () => setModal({ group: g }) },
                      {
                        label: 'Delete group',
                        icon: Trash,
                        destructive: true,
                        onClick: () => {
                          setGroups((all) => all.filter((x) => x.id !== g.id))
                          toast(`${g.name} deleted`)
                        },
                      },
                    ]}
                  />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
      <Pagination {...paging.props} />

      {modal && (
        <GroupModal
          group={modal.group}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            if (modal.group) {
              const id = modal.group.id
              setGroups((all) => all.map((g) => (g.id === id ? { ...g, ...draft, updated: TODAY_ISO } : g)))
              toast('Group updated')
            } else {
              setGroups((all) => [
                ...all,
                { id: newId('g'), ...draft, updated: TODAY_ISO, tone: TONES[all.length % TONES.length] },
              ])
              toast(`${draft.name} created`)
            }
            setModal(null)
          }}
        />
      )}
    </>
  )
}

function GroupModal({
  group,
  onClose,
  onSave,
}: {
  group?: OrgGroup
  onClose: () => void
  onSave: (draft: { name: string; description: string; members: number }) => void
}) {
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [members, setMembers] = useState(String(group?.members ?? 0))

  return (
    <Modal
      title={group ? 'Edit group' : 'Create group'}
      onClose={onClose}
      footer={
        <>
          <Button variant="solid" shade="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), description: description.trim(), members: Math.max(0, Number(members) || 0) })}
          >
            {group ? 'Save' : 'Create group'}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <FieldLabel htmlFor="group-name" required>
          Group name
        </FieldLabel>
        <TextInput id="group-name" autoFocus value={name} placeholder="e.g. Remote - Europe" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="group-desc">Description</FieldLabel>
        <TextArea id="group-desc" value={description} placeholder="What is this group for?" onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel htmlFor="group-members">Members</FieldLabel>
        <TextInput
          id="group-members"
          type="number"
          min={0}
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          className="w-32 tabular-nums text-label-small"
        />
        <p className="text-caption-sm text-muted">Mock shortcut - the real flow picks workers from People.</p>
      </div>
    </Modal>
  )
}
