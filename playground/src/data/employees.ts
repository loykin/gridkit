export interface Employee {
  id: number
  name: string
  department: string
  role: string
  salary: number
  status: 'Active' | 'On Leave' | 'Terminated'
  startDate: string
  score: number
}

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Sales', 'HR', 'Finance']
const ROLES = ['Engineer', 'Senior Engineer', 'Lead', 'Manager', 'Director', 'Analyst']
const STATUSES: Employee['status'][] = ['Active', 'On Leave', 'Terminated']

function makeRow(i: number): Employee {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!
  return {
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: dept,
    role: ROLES[Math.floor(i / DEPARTMENTS.length) % ROLES.length]!,
    salary: 40000 + ((i * 1337) % 120000),
    status: STATUSES[i % 3]!,
    startDate: `202${i % 5}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    score: Math.round(((i * 17) % 100) * 10) / 10,
  }
}

export const ALL_DATA: Employee[] = Array.from({ length: 500 }, (_, i) => makeRow(i))
export const SMALL_DATA = ALL_DATA.slice(0, 50)
