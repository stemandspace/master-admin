'use client'

import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import ReactPlayer from 'react-player'
import { updateSubmissionStatus } from '@/utils/fetcher-functions'
import strapi from '@/utils/strapi'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Submission } from '../data/schema'

interface Props {
  data: Submission
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmissionActionDialog({ data, open, onOpenChange }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  // Function to check media type
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  const isPDF = (url: string) => /\.pdf$/i.test(url)
  const isAudio = (url: string) => /\.(mp3|wav|ogg|m4a)$/i.test(url)

  // Fetch reward details if content_type is diy and status is selected
  const {} = useQuery({
    queryKey: [
      'submission-rewards',
      data.id,
      data.content_type,
      data.content_id,
    ],
    queryFn: async () => {
      if (data.content_type === 'diy' && data.content_id) {
        try {
          const response = await strapi.get(
            `/live-events?filters[live][id][$eq]=${data.content_id}&populate[live]=*&populate[submission_rewards]=*`
          )
          const liveEvents = response.data.data
          if (liveEvents && liveEvents.length > 0) {
            return liveEvents[0].submission_rewards || []
          }
        } catch (error) {
          console.log('Error fetching rewards:', error)
        }
      }
      return []
    },
    enabled: open && data.content_type === 'diy' && !!data.content_id,
  })

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await updateSubmissionStatus({
        id: data.id,
        status: 'selected',
        submissionData: {
          content_type: data.content_type,
          content_id: data.content_id,
          user: {
            id: data.user.id,
            email: data.user.email,
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            username: data.user.username,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['submission', data.id] })
      onOpenChange(false)
      toast({
        title: 'Success',
        description: 'Submission confirmed successfully',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to confirm submission',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsLoading(true)
      await updateSubmissionStatus({
        id: data.id,
        status: 'rejected',
        submissionData: {
          content_type: data.content_type,
          content_id: data.content_id,
          user: {
            id: data.user.id,
            email: data.user.email,
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            username: data.user.username,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['submission', data.id] })
      onOpenChange(false)
      toast({
        title: 'Success',
        description: 'Submission rejected successfully',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to reject submission',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] max-w-[95%] flex-col md:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>Submission Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className='flex-1 overflow-y-auto px-2 pb-4 md:px-4'>
          <div className='space-y-6'>
            {/* Label */}
            {data.label && (
              <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Label:
                </h3>
                <p className='mt-2 text-gray-700 dark:text-gray-300'>
                  {data.label}
                </p>
              </div>
            )}

            {/* Text Content */}
            {data.text && (
              <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Text:
                </h3>
                <p className='mt-2 text-gray-700 dark:text-gray-300'>
                  {data.text}
                </p>
              </div>
            )}

            {/* Media Preview */}
            {data.media && data.media.length > 0 && (
              <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Media ({data.media.length}):
                </h3>
                <div className='mt-3 space-y-4'>
                  {data.media.map((mediaItem, index) => {
                    const mediaUrl = mediaItem.url
                    return (
                      <div key={mediaItem.id || index} className='space-y-2'>
                        {isVideo(mediaUrl) ? (
                          <ReactPlayer
                            url={mediaUrl}
                            controls
                            className='max-h-60 w-full rounded-lg border'
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
                        ) : isAudio(mediaUrl) ? (
                          <audio controls className='w-full'>
                            <source src={mediaUrl} />
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={`Media ${index + 1}`}
                            className='h-auto max-h-60 w-full rounded-lg border object-contain'
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Submission Details */}
            <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Submission Details:
              </h3>
              <div className='mt-3 grid gap-2'>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Content Type:
                  </span>{' '}
                  <span className='capitalize'>{data.content_type}</span>
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Content ID:
                  </span>{' '}
                  {data.content_id}
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Status:
                  </span>{' '}
                  <span className='capitalize'>{data.status}</span>
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Rewarded:
                  </span>{' '}
                  {data.rewarded ? 'Yes' : 'No'}
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Created At:
                  </span>{' '}
                  {new Date(data.createdAt).toLocaleString()}
                </p>
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
                  {data.user?.firstname && data.user?.lastname
                    ? `${data.user.firstname} ${data.user.lastname}`
                    : data.user?.username || 'N/A'}
                </p>
                <p>
                  <span className='font-medium text-gray-800 dark:text-gray-200'>
                    Email:
                  </span>{' '}
                  {data.user?.email}
                </p>
                {data.user?.mobile && (
                  <p>
                    <span className='font-medium text-gray-800 dark:text-gray-200'>
                      Phone:
                    </span>{' '}
                    {data.user.mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Live Event */}
            {data.live_event && (
              <div className='rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Live Event:
                </h3>
                <p className='mt-2 text-gray-700 dark:text-gray-300'>
                  {data.live_event.title || `Event ID: ${data.live_event.id}`}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex gap-2 rounded-lg bg-gray-100 p-3 shadow dark:bg-gray-800 md:p-4'>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || data.status !== 'pending'}
                className='flex-1'
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading || data.status !== 'pending'}
                variant='destructive'
                className='flex-1'
              >
                {isLoading ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
