export interface ServiceRow {
  id: string
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  owner: string
}

export const SERVICES: ServiceRow[] = [
  { id: 's1', name: 'API Gateway', status: 'healthy', latency: 42, owner: 'platform' },
  { id: 's2', name: 'Auth Service', status: 'healthy', latency: 18, owner: 'security' },
  { id: 's3', name: 'Payment Processor', status: 'degraded', latency: 310, owner: 'payments' },
  { id: 's4', name: 'Notification Service', status: 'healthy', latency: 55, owner: 'comms' },
  { id: 's5', name: 'User Service', status: 'healthy', latency: 23, owner: 'platform' },
  { id: 's6', name: 'Analytics Ingestor', status: 'down', latency: 0, owner: 'data' },
  { id: 's7', name: 'Search Service', status: 'healthy', latency: 88, owner: 'search' },
  { id: 's8', name: 'Storage Service', status: 'healthy', latency: 34, owner: 'infra' },
]
