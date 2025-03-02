'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  data: {
    id: string
    question: string
    media?: {
      url: string
    }
    user: {
      firstName?: string
      lastName?: string
      username?: string
      email: string
      mobile: string
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnsweringActionDialog({ data, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className='max-w-[95%] md:max-w-xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className='-mr-4 h-[26.25rem]--- w-full py-1 pr-4'>
          <div className='space-y-4 p-4'>
            {/* Question */}
            <div>
              <h3 className='text-lg font-semibold'>Question:</h3>
              <p className='text-gray-700 dark:text-gray-300'>{data?.question}</p>
            </div>

            {/* Media Preview */}
            {data?.media?.url && (
              <div>
                <h3 className='text-lg font-semibold'>Media :</h3>
                <img
                  src={data?.media?.url}
                  alt='Media Preview'
                  className='w-full max-h-64 object-contain rounded-lg border'
                />
              </div>
            )}

            {/* User Details */}
            <div>
              <h3 className='text-lg font-semibold'>User Details:</h3>
              <p><strong>Name:</strong> {data?.user?.firstName && data?.user?.lastName ? `${data?.user?.firstName} ${data?.user?.lastName}` : data?.user?.username}</p>
              <p><strong>Email:</strong> {data?.user?.email}</p>
              <p><strong>Phone:</strong> {data?.user?.mobile}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
