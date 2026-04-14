import { createContext, useContext } from 'react'

interface PlaygroundConfig {
  rounded: boolean
}

export const PlaygroundContext = createContext<PlaygroundConfig>({ rounded: false })

export function usePlayground() {
  return useContext(PlaygroundContext)
}
