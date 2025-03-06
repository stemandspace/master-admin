'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import ReactPlayer from 'react-player'
import { challengeRequestUpdate } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSearch } from '@tanstack/react-router'

interface Props {
  data: {
    id: string
    status: string
    winner: boolean
    media?: {
      url: string
    }
    user: {
      firstname?: string
      lastname?: string
      username?: string
      email: string
      mobile: string
      id: string
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}
import { useQueryClient } from '@tanstack/react-query';

export function ChallengeActionDialog({ data, open, onOpenChange }: Props) {
  const mediaUrl = data?.media?.url
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>(data?.status || 'pending')
  const queryClient = useQueryClient();
  // Function to check media type
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  const isPDF = (url: string) => /\.pdf$/i.test(url)
  const search: {
    challenge?: string
  } = useSearch({ from: '/_authenticated/challenges/' })

  const id = search?.challenge || ''

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const id = data?.id
      await challengeRequestUpdate({
        id,
        status,
        winner: false,
        userId: data.user.id,
        email: data.user.email,
        name: `${data.user.firstname} ${data.user.lastname}`,
      })
      //@ts-ignore
      queryClient.invalidateQueries(['challenge-activities', id]);
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.log('Challenge Update Error', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] max-w-[95%] flex-col md:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>Challenge Activity Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className='flex-1 overflow-y-auto px-2 pb-4 md:px-4'>
          <div className='space-y-6'>
            {/* Media Preview */}
            {mediaUrl && (
              <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Media:
                </h3>
                <div className='mt-3 flex items-center justify-center'>
                  {isVideo(mediaUrl) ? (
                    <ReactPlayer
                      url={mediaUrl}
                      controls
                      className='max-h-40 w-full rounded-lg border'
                    />
                  ) : isPDF(mediaUrl) ? (
                    <Button
                      asChild
                      className='mt-2 flex items-center gap-2 text-sm'
                    >
                      <a
                        href={mediaUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        Open PDF <ExternalLink size={16} />
                      </a>
                    </Button>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt='Media Preview'
                      className='h-40 w-full rounded-lg border object-contain'
                    />
                  )}
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  Status:
                </h3>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className='w-[70%]'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Rejected', value: 'rejected' },
                      { label: 'Winner', value: 'winner' },
                    ].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/*    <div className='my-4 flex items-center justify-between'>
                <Label htmlFor='winner' className='text-sm font-semibold'>
                  Winner:
                </Label>
                <Switch
                  id='winner'
                  checked={winner}
                  onCheckedChange={setWinner}
                />
              </div> */}
              <div className='mt-3 flex justify-end'>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Save...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* User Details */}
            <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                User Details:
              </h3>
              <div className='mt-3 grid gap-2'>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Name:
                  </span>{' '}
                  {data?.user?.firstname && data?.user?.lastname
                    ? `${data?.user?.firstname} ${data?.user?.lastname}`
                    : data?.user?.username}
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Email:
                  </span>{' '}
                  {data?.user?.email}
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Phone:
                  </span>{' '}
                  {data?.user?.mobile}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
