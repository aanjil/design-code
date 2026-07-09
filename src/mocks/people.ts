/**
 * Deterministic mock people data. Seeded PRNG — identical rows on every reload,
 * so screenshots, demos, and annotations stay stable. No APIs, ever.
 */

export interface Person {
  id: string
  name: string
  email: string
  role: string
  department: 'Engineering' | 'Design' | 'Finance' | 'People' | 'Sales'
  status: 'active' | 'invited' | 'offboarded'
  country: string
  /** Annual, USD */
  salary: number
  /** yyyy-mm-dd */
  startDate: string
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Kai', 'Ira', 'Leo', 'Nina', 'Omar', 'Priya', 'Sena', 'Tomas', 'Yuki', 'Anders', 'Bina', 'Caleb', 'Dara', 'Elif', 'Farid']
const LAST = ['Sharma', 'Chen', 'Okafor', 'Novak', 'Silva', 'Haddad', 'Kim', 'Larsen', 'Moreau', 'Patel', 'Reyes', 'Sato', 'Tesfaye', 'Varga', 'Wong', 'Zulu', 'Byrne', 'Costa', 'Dietrich', 'Eriksen']
const ROLES: Record<Person['department'], Array<string>> = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Engineering Manager'],
  Design: ['Product Designer', 'Senior Designer', 'Design Lead'],
  Finance: ['Accountant', 'Payroll Specialist', 'Finance Manager'],
  People: ['People Ops', 'Recruiter', 'HR Business Partner'],
  Sales: ['Account Executive', 'SDR', 'Sales Manager'],
}
const DEPARTMENTS = Object.keys(ROLES) as Array<Person['department']>
const COUNTRIES = ['United States', 'Nepal', 'Germany', 'Brazil', 'Japan', 'Kenya', 'Canada', 'India', 'Ireland', 'Mexico']
const STATUSES: Array<Person['status']> = ['active', 'active', 'active', 'active', 'invited', 'offboarded']

function makePeople(count: number, seed: number): Array<Person> {
  const rand = mulberry32(seed)
  const pick = <T,>(arr: Array<T>): T => arr[Math.floor(rand() * arr.length)]

  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST)
    const last = pick(LAST)
    const department = pick(DEPARTMENTS)
    const year = 2019 + Math.floor(rand() * 7)
    const month = 1 + Math.floor(rand() * 12)
    const day = 1 + Math.floor(rand() * 28)
    return {
      id: `emp-${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@niural.dev`.toLowerCase(),
      role: pick(ROLES[department]),
      department,
      status: pick(STATUSES),
      country: pick(COUNTRIES),
      salary: 48000 + Math.floor(rand() * 33) * 4000,
      startDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    }
  })
}

export const people: Array<Person> = makePeople(42, 20260709)

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const date = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const fmtMoney = (n: number): string => money.format(n)
export const fmtDate = (iso: string): string => date.format(new Date(`${iso}T00:00:00`))
export const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
