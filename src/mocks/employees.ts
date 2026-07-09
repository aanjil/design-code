/**
 * Deterministic employee dataset for the Employees page experiments.
 * Fields mirror the filterable attributes in the Figma design:
 * work location, employee type, job title, compensation type, hire date.
 * Seeded PRNG — identical rows every reload.
 */

export type EmployeeStatus = 'active' | 'invited' | 'onboarding' | 'offboarded'

export interface Employee {
  id: string
  name: string
  email: string
  jobTitle: string
  employeeType: 'Full-time' | 'Part-time' | 'Contractor' | 'EOR'
  workLocation: string
  compensationType: 'Salary' | 'Hourly'
  /** Annual USD when Salary, per-hour USD when Hourly */
  compensation: number
  currency: 'USD'
  /** yyyy-mm-dd */
  hireDate: string
  status: EmployeeStatus
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

const FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Kai', 'Ira', 'Leo', 'Nina', 'Omar', 'Priya', 'Sena', 'Tomas', 'Yuki', 'Anders', 'Bina', 'Caleb', 'Dara', 'Elif', 'Farid', 'Greta', 'Hana', 'Ivan', 'Jules']
const LAST = ['Sharma', 'Chen', 'Okafor', 'Novak', 'Silva', 'Haddad', 'Kim', 'Larsen', 'Moreau', 'Patel', 'Reyes', 'Sato', 'Tesfaye', 'Varga', 'Wong', 'Zulu', 'Byrne', 'Costa', 'Dietrich', 'Eriksen', 'Fischer', 'Gauchan', 'Herrera', 'Iyer']

export const JOB_TITLES = [
  'Account Executive',
  'Accountant',
  'Data Scientist',
  'Finance Analyst',
  'HR Admin',
  'Software Engineer',
  'Product Designer',
  'Payroll Specialist',
] as const

export const EMPLOYEE_TYPES = ['Full-time', 'Part-time', 'Contractor', 'EOR'] as const

export const WORK_LOCATIONS = [
  'New York HQ',
  'Remote — US',
  'Remote — EU',
  'Kathmandu',
  'London',
  'Berlin',
  'São Paulo',
] as const

export const COMPENSATION_TYPES = ['Salary', 'Hourly'] as const

export const EMPLOYEE_STATUSES: Array<EmployeeStatus> = [
  'active',
  'invited',
  'onboarding',
  'offboarded',
]

function makeEmployees(count: number, seed: number): Array<Employee> {
  const rand = mulberry32(seed)
  const pick = <T,>(arr: ReadonlyArray<T>): T =>
    arr[Math.floor(rand() * arr.length)]

  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST)
    const last = pick(LAST)
    const compensationType = rand() < 0.82 ? 'Salary' : ('Hourly' as const)
    const year = 2019 + Math.floor(rand() * 8)
    const month = 1 + Math.floor(rand() * 12)
    const day = 1 + Math.floor(rand() * 28)
    const statusRoll = rand()
    const status: EmployeeStatus =
      statusRoll < 0.72
        ? 'active'
        : statusRoll < 0.84
          ? 'invited'
          : statusRoll < 0.93
            ? 'onboarding'
            : 'offboarded'
    return {
      id: `EMP${String(120400 + i * 7 + Math.floor(rand() * 6)).padStart(6, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@nexuscorp.com`.toLowerCase(),
      jobTitle: pick(JOB_TITLES),
      employeeType: pick(EMPLOYEE_TYPES),
      workLocation: pick(WORK_LOCATIONS),
      compensationType,
      compensation:
        compensationType === 'Salary'
          ? 52000 + Math.floor(rand() * 36) * 4000
          : 28 + Math.floor(rand() * 60),
      currency: 'USD',
      hireDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      status,
    }
  })
}

export const employees: Array<Employee> = makeEmployees(57, 91120708)

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

export const fmtCompensation = (e: Employee): string =>
  e.compensationType === 'Salary'
    ? `${money.format(e.compensation)}/yr`
    : `${money.format(e.compensation)}/hr`

export const fmtHireDate = (iso: string): string =>
  date.format(new Date(`${iso}T00:00:00`))

export const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  onboarding: 'Onboarding',
  offboarded: 'Offboarded',
}
