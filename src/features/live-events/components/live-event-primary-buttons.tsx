import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiveEvents } from '../context/live-events-context'

export function LiveEventPrimaryButtons() {
  const { setOpen } = useLiveEvents()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Live Event</span>
        <Plus size={18} />
      </Button>
    </div>
  )
}
