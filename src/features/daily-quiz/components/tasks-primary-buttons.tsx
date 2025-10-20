import { IconDownload, IconUpload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useTasks } from '../context/tasks-context'

export function TasksPrimaryButtons() {
  const { setOpen } = useTasks()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('import')}
      >
        <span>Import</span> <IconUpload size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('download')}>
        <span>Download</span> <IconDownload size={18} />
      </Button>
    </div>
  )
}
