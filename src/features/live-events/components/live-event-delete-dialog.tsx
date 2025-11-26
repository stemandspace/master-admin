'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteLiveEvent } from '@/utils/fetcher-functions'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LiveEvent } from '../data/schema'

interface Props {
  currentRow?: LiveEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LiveEventDeleteDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteLiveEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
      toast({
        title: 'Success',
        description: 'Live event deleted successfully',
      })
      onOpenChange(false)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete live event',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = () => {
    if (currentRow) {
      deleteMutation.mutate({ id: currentRow.id })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>Delete Live Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{currentRow?.title}&quot;?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
