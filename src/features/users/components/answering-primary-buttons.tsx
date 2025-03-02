import { useState } from 'react'
import useMark from '@/hooks/use-mark'
import { Button } from '@/components/ui/button'
import { ConnectAnswerDialog } from './connect-answer-dialog'
import { CheckSquare, Square } from 'lucide-react'

// import { useUsers } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { unmarkAll, storage } = useMark()
  const [open, setOpen] = useState(false)
  // const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button
        disabled={storage.length === 0}
        variant='outline'
        className='space-x-1'
        onClick={() => unmarkAll()}
      >
        <span>Uncheck All</span> <Square size={18} />
      </Button>
      <Button
        disabled={storage.length == 0}
        className='space-x-1'
        onClick={() => setOpen(true)}

        // onClick={() => setOpen('add')}
      >
        <span>Connect Answer</span> <CheckSquare size={18} />
      </Button>
      <ConnectAnswerDialog open={open} onOpenChange={() => setOpen(!open)} />
    </div>
  )
}
