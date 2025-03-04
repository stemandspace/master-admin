'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import ReactPlayer from 'react-player'
import { getConfigRewards } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const search: {
    theme?: string
  } = useSearch({ from: '/_authenticated/users/' })

  const id = search?.theme || ''

  const mediaUrl = data?.media?.url

  // Function to check media type
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  const isPDF = (url: string) => /\.pdf$/i.test(url)

  const { data: rewards } = useQuery({
    queryKey: ['disconvery-jar-config-rewards', id],
    queryFn: async () => await getConfigRewards({ id }),
    enabled: !!id,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-[95%] md:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className='-mr-4 h-[80vh] w-full py-1 pr-4 md:h-[30rem]'>
          <div className='space-y-6 py-0 md:p-4'>
            {/* Question */}
            <div className='rounded-lg bg-gray-100 p-2 shadow dark:bg-gray-800 md:p-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Question:
              </h3>
              <p className='mt-2 text-gray-700 dark:text-gray-300'>
                {data?.question}
              </p>
            </div>

            {/* Media Preview */}
            {mediaUrl && (
              <div className='rounded-lg bg-gray-100 p-2 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Media:
                </h3>
                <div className='mt-3'>
                  {isVideo(mediaUrl) ? (
                    <ReactPlayer
                      url={mediaUrl}
                      controls
                      className='max-h-40 rounded-lg border'
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
            {rewards?.length > 0 && (
              <div className='mt-4 grid gap-4 rounded-lg bg-gray-100 p-2 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Rewards:
                </h3>
                {rewards.map((reward: any) => (
                  <div
                    key={reward.id}
                    className='grid gap-2 rounded-lg border border-gray-300 p-4 shadow-sm dark:border-gray-700 md:grid-cols-2'
                  >
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      <span className='font-semibold text-gray-700 dark:text-gray-300'>
                        ID:
                      </span>{' '}
                      {reward.id}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      <span className='font-semibold text-gray-700 dark:text-gray-300'>
                        Type:
                      </span>{' '}
                      {reward.type}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      <span className='font-semibold text-gray-700 dark:text-gray-300'>
                        Title:
                      </span>{' '}
                      {reward.title}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      <span className='font-semibold text-gray-700 dark:text-gray-300'>
                        Value:
                      </span>{' '}
                      {reward.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* User Details */}
            <div className='rounded-lg bg-gray-100 p-2 shadow dark:bg-gray-800 md:p-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                User Details:
              </h3>
              <div className='mt-3 space-y-2'>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Name:
                  </span>{' '}
                  {data?.user?.firstName && data?.user?.lastName
                    ? `${data?.user?.firstName} ${data?.user?.lastName}`
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
