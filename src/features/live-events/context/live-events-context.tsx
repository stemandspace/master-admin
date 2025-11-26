import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { LiveEvent } from '../data/schema'

type LiveEventsDialogType =
  | 'add'
  | 'edit'
  | 'delete'
  | 'select-winners'
  | 'reward-notification'

interface LiveEventsContextType {
  open: LiveEventsDialogType | null
  setOpen: (str: LiveEventsDialogType | null) => void
  currentRow: LiveEvent | null
  setCurrentRow: React.Dispatch<React.SetStateAction<LiveEvent | null>>
}

const LiveEventsContext = React.createContext<LiveEventsContextType | null>(
  null
)

interface Props {
  children: React.ReactNode
}

export default function LiveEventsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<LiveEventsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<LiveEvent | null>(null)

  return (
    <LiveEventsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </LiveEventsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLiveEvents = () => {
  const liveEventsContext = React.useContext(LiveEventsContext)

  if (!liveEventsContext) {
    throw new Error('useLiveEvents has to be used within <LiveEventsProvider>')
  }

  return liveEventsContext
}
