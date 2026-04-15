export interface Pod {
  id: string
  name: string
  namespace: string
  status: 'Running' | 'Pending' | 'Failed' | 'CrashLoopBackOff' | 'Terminating'
  cpu: number
  memory: number
  restarts: number
  node: string
  age: string
}

const NAMESPACES = ['default', 'kube-system', 'monitoring', 'data-platform', 'ml-serving']
const NODES = ['node-01', 'node-02', 'node-03', 'node-04', 'node-05']
const WORKLOADS = [
  'api',
  'worker',
  'scheduler',
  'gateway',
  'inference',
  'collector',
  'syncer',
  'proxy',
]
const STATUSES: Pod['status'][] = [
  'Running',
  'Running',
  'Running',
  'Running',
  'Pending',
  'Failed',
  'CrashLoopBackOff',
  'Terminating',
]

function pick<T>(arr: T[], i: number): T {
  return arr[Math.abs(i) % arr.length]!
}

export function generatePods(count = 120): Pod[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pod-${pick(WORKLOADS, i)}-${String(i).padStart(4, '0')}`,
    name: `${pick(WORKLOADS, i)}-${String(i).padStart(4, '0')}-${Math.random().toString(36).slice(2, 7)}`,
    namespace: pick(NAMESPACES, i),
    status: pick(STATUSES, i),
    cpu: 50 + ((i * 37) % 900),
    memory: 64 + ((i * 53) % 3968),
    restarts: (i * 7) % 15,
    node: pick(NODES, i),
    age: `${1 + (i % 29)}d`,
  }))
}

export function tickPods(pods: Pod[]): Pod[] {
  return pods.map((pod) => {
    if (Math.random() > 0.15) return pod
    const roll = Math.random()
    if (roll < 0.3) {
      return {
        ...pod,
        cpu: Math.max(10, pod.cpu + Math.floor((Math.random() - 0.5) * 200)),
        memory: Math.max(32, pod.memory + Math.floor((Math.random() - 0.5) * 512)),
      }
    } else if (roll < 0.55) {
      const next: Pod['status'][] =
        pod.status === 'Running'
          ? ['Running', 'Running', 'Pending', 'CrashLoopBackOff']
          : ['Running', 'Running', 'Running', pod.status]
      return { ...pod, status: next[Math.floor(Math.random() * next.length)]! }
    } else if (roll < 0.75) {
      return { ...pod, restarts: pod.restarts + 1, status: 'Running' }
    } else {
      return {
        ...pod,
        name: `${pod.name.split('-').slice(0, -1).join('-')}-${Math.random().toString(36).slice(2, 7)}`,
        restarts: 0,
        status: 'Running' as const,
        cpu: 50 + Math.floor(Math.random() * 200),
        memory: 128 + Math.floor(Math.random() * 512),
      }
    }
  })
}
