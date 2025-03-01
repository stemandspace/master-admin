import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import useMark from '@/hooks/use-mark'
import { Button } from '@/components/ui/button'

// import { useUsers } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { unmarkAll, storage } = useMark()
  // const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button
        disabled={storage.length === 0}
        variant='outline'
        className='space-x-1'
        onClick={() => unmarkAll()}
      >
        <span>Uncheck All</span> <IconMailPlus size={18} />
      </Button>
      <Button
        disabled={storage.length == 0}
        className='space-x-1'

        // onClick={() => setOpen('add')}
      >
        <span>Connect Answer</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
}
