export interface DashboardItem {
  id: string
  name: string
  type: 'group' | 'dashboard'
  starred: boolean
  tags: string[]
  lastViewed: string
  panels: number
  children?: DashboardItem[]
}

function tag(...t: string[]) { return t }

export const DASHBOARD_TREE: DashboardItem[] = [
  {
    id: 'g-infra',
    name: 'Infrastructure',
    type: 'group',
    starred: true,
    tags: tag('infra'),
    lastViewed: '2 min ago',
    panels: 0,
    children: [
      {
        id: 'g-k8s',
        name: 'Kubernetes',
        type: 'group',
        starred: false,
        tags: tag('k8s'),
        lastViewed: '2 min ago',
        panels: 0,
        children: [
          { id: 'd-nodes',   name: 'Node Exporter',    type: 'dashboard', starred: true,  tags: tag('k8s', 'metrics'), lastViewed: '2 min ago',   panels: 14 },
          { id: 'd-pods',    name: 'Kubernetes Pods',  type: 'dashboard', starred: false, tags: tag('k8s'),            lastViewed: '1 hour ago',  panels: 9  },
          { id: 'd-hpa',     name: 'HPA & Autoscaler', type: 'dashboard', starred: false, tags: tag('k8s'),            lastViewed: '3 hours ago', panels: 5  },
        ],
      },
      {
        id: 'g-network',
        name: 'Network',
        type: 'group',
        starred: false,
        tags: tag('infra'),
        lastViewed: '3 hours ago',
        panels: 0,
        children: [
          { id: 'd-network', name: 'Network Overview', type: 'dashboard', starred: false, tags: tag('infra'),          lastViewed: '3 hours ago', panels: 7 },
          { id: 'd-dns',     name: 'DNS Latency',      type: 'dashboard', starred: false, tags: tag('infra'),          lastViewed: 'Yesterday',   panels: 4 },
        ],
      },
      { id: 'd-storage', name: 'Storage & Disk IO', type: 'dashboard', starred: true, tags: tag('infra'), lastViewed: 'Yesterday', panels: 6 },
    ],
  },
  {
    id: 'g-services',
    name: 'Services',
    type: 'group',
    starred: false,
    tags: tag('api', 'prod'),
    lastViewed: '10 min ago',
    panels: 0,
    children: [
      {
        id: 'g-backend',
        name: 'Backend APIs',
        type: 'group',
        starred: false,
        tags: tag('api'),
        lastViewed: '10 min ago',
        panels: 0,
        children: [
          { id: 'd-api',      name: 'API Gateway Latency', type: 'dashboard', starred: true,  tags: tag('api', 'prod'),    lastViewed: '10 min ago',  panels: 11 },
          { id: 'd-auth',     name: 'Auth Service',        type: 'dashboard', starred: false, tags: tag('api'),            lastViewed: '2 hours ago', panels: 5  },
          { id: 'd-payments', name: 'Payment Processing',  type: 'dashboard', starred: false, tags: tag('prod', 'alerts'), lastViewed: '5 hours ago', panels: 8  },
        ],
      },
      { id: 'd-cdn', name: 'CDN Edge Metrics', type: 'dashboard', starred: false, tags: tag('prod'), lastViewed: '1 day ago', panels: 4 },
    ],
  },
  {
    id: 'g-databases',
    name: 'Databases',
    type: 'group',
    starred: false,
    tags: tag('db'),
    lastViewed: '45 min ago',
    panels: 0,
    children: [
      { id: 'd-pg',     name: 'PostgreSQL Overview', type: 'dashboard', starred: true,  tags: tag('db', 'prod'),    lastViewed: '45 min ago',  panels: 12 },
      { id: 'd-redis',  name: 'Redis Cache Metrics', type: 'dashboard', starred: false, tags: tag('db'),            lastViewed: '2 hours ago', panels: 8  },
      { id: 'd-clickh', name: 'ClickHouse Queries',  type: 'dashboard', starred: false, tags: tag('db', 'metrics'), lastViewed: 'Yesterday',   panels: 6  },
    ],
  },
  {
    id: 'g-alerts',
    name: 'Alerting',
    type: 'group',
    starred: false,
    tags: tag('alerts'),
    lastViewed: '1 day ago',
    panels: 0,
    children: [
      { id: 'd-oncall', name: 'On-Call Overview', type: 'dashboard', starred: false, tags: tag('alerts'),         lastViewed: '1 day ago',  panels: 4 },
      { id: 'd-slo',    name: 'SLO Burn Rate',    type: 'dashboard', starred: true,  tags: tag('alerts', 'prod'), lastViewed: '3 days ago', panels: 7 },
    ],
  },
  // Standalone dashboards (no group)
  { id: 'd-home', name: 'Home Dashboard',      type: 'dashboard', starred: true,  tags: tag('prod'), lastViewed: '5 min ago',  panels: 3 },
  { id: 'd-perf', name: 'Performance Summary', type: 'dashboard', starred: false, tags: tag('prod'), lastViewed: '1 hour ago', panels: 5 },
]
