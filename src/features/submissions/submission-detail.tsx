import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import ReactPlayer from 'react-player'
import {
  getSubmission,
  updateSubmissionStatus,
} from '@/utils/fetcher-functions'
import strapi from '@/utils/strapi'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export default function SubmissionDetail() {
  const { submissionId } = useParams({
    from: '/_authenticated/submissions/$submissionId',
  })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const { data: submission, isLoading: isLoadingSubmission } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => await getSubmission({ id: submissionId }),
  })

  // Fetch reward details if content_type is diy
  const { data: rewardData } = useQuery({
    queryKey: [
      'submission-rewards',
      submissionId,
      submission?.content_type,
      submission?.content_id,
    ],
    queryFn: async () => {
      if (submission?.content_type === 'diy' && submission?.content_id) {
        try {
          const response = await strapi.get(
            `/live-events?filters[live][id][$eq]=${submission.content_id}&populate[live]=*&populate[submission_rewards]=*`
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
    enabled:
      !!submission &&
      submission.content_type === 'diy' &&
      !!submission.content_id,
  })

  // Function to check media type
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  const isPDF = (url: string) => /\.pdf$/i.test(url)
  const isAudio = (url: string) => /\.(mp3|wav|ogg|m4a)$/i.test(url)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      if (!submission) return

      await updateSubmissionStatus({
        id: submissionId,
        status: 'selected',
        submissionData: {
          content_type: submission.content_type,
          content_id: submission.content_id,
          user: {
            id: submission.user.id,
            email: submission.user.email,
            firstname: submission.user.firstname,
            lastname: submission.user.lastname,
            username: submission.user.username,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
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
      if (!submission) return

      await updateSubmissionStatus({
        id: submissionId,
        status: 'rejected',
        submissionData: {
          content_type: submission.content_type,
          content_id: submission.content_id,
          user: {
            id: submission.user.id,
            email: submission.user.email,
            firstname: submission.user.firstname,
            lastname: submission.user.lastname,
            username: submission.user.username,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
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

  if (isLoadingSubmission) {
    return (
      <div>
        <Header fixed>
          <Search />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-12'>
            <div>Loading...</div>
          </div>
        </Main>
      </div>
    )
  }

  if (!submission) {
    return (
      <div>
        <Header fixed>
          <Search />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-12'>
            <div>Submission not found</div>
          </div>
        </Main>
      </div>
    )
  }

  return (
    <div>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4'>
          <Button
            variant='ghost'
            onClick={() => navigate({ to: '/submissions' })}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Submissions
          </Button>
        </div>

        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Submission Details
              </h2>
              <p className='text-muted-foreground'>ID: {submission.id}</p>
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || submission.status !== 'pending'}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading || submission.status !== 'pending'}
                variant='destructive'
              >
                {isLoading ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </div>

          {/* Label */}
          {submission.label && (
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-2 text-lg font-semibold'>Label</h3>
              <p className='text-muted-foreground'>{submission.label}</p>
            </div>
          )}

          {/* Text Content */}
          {submission.text && (
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-2 text-lg font-semibold'>Text Content</h3>
              <p className='whitespace-pre-wrap text-muted-foreground'>
                {submission.text}
              </p>
            </div>
          )}

          {/* Media */}
          {submission.media && submission.media.length > 0 && (
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-4 text-lg font-semibold'>
                Media ({submission.media.length})
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                {submission.media.map((mediaItem: any, index: number) => {
                  const mediaUrl = mediaItem.url
                  return (
                    <div
                      key={mediaItem.id || index}
                      className='rounded-lg border bg-muted/50 p-4'
                    >
                      {isVideo(mediaUrl) ? (
                        <ReactPlayer
                          url={mediaUrl}
                          controls
                          className='w-full rounded-lg'
                          width='100%'
                          height='auto'
                        />
                      ) : isPDF(mediaUrl) ? (
                        <div className='flex flex-col items-center justify-center space-y-2'>
                          <p className='text-sm text-muted-foreground'>
                            PDF Document
                          </p>
                          <Button asChild variant='outline'>
                            <a
                              href={mediaUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              Open PDF <ExternalLink className='ml-2 h-4 w-4' />
                            </a>
                          </Button>
                        </div>
                      ) : isAudio(mediaUrl) ? (
                        <div className='space-y-2'>
                          <p className='text-sm text-muted-foreground'>
                            Audio File
                          </p>
                          <audio controls className='w-full'>
                            <source src={mediaUrl} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`Media ${index + 1}`}
                          className='h-auto w-full rounded-lg object-contain'
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Submission Details */}
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-4 text-lg font-semibold'>Submission Details</h3>
              <div className='space-y-2'>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Content Type:
                  </span>
                  <p className='capitalize'>{submission.content_type}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Content ID:
                  </span>
                  <p>{submission.content_id}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Status:
                  </span>
                  <p className='capitalize'>{submission.status}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Rewarded:
                  </span>
                  <p>{submission.rewarded ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Created At:
                  </span>
                  <p>{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Updated At:
                  </span>
                  <p>{new Date(submission.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-4 text-lg font-semibold'>User Details</h3>
              <div className='space-y-2'>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Name:
                  </span>
                  <p>
                    {submission.user?.firstname && submission.user?.lastname
                      ? `${submission.user.firstname} ${submission.user.lastname}`
                      : submission.user?.username || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Email:
                  </span>
                  <p>{submission.user?.email}</p>
                </div>
                {submission.user?.mobile && (
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Phone:
                    </span>
                    <p>{submission.user.mobile}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Event */}
          {submission.live_event && (
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-2 text-lg font-semibold'>Live Event</h3>
              <p className='text-muted-foreground'>
                {submission.live_event.title ||
                  `Event ID: ${submission.live_event.id}`}
              </p>
            </div>
          )}

          {/* Reward Details */}
          {rewardData && rewardData.length > 0 && (
            <div className='rounded-lg border bg-card p-6 shadow-sm'>
              <h3 className='mb-4 text-lg font-semibold'>Rewards</h3>
              <div className='space-y-3'>
                {rewardData.map((reward: any) => (
                  <div
                    key={reward.id}
                    className='rounded-md border bg-muted/50 p-4'
                  >
                    <div className='grid gap-2 md:grid-cols-2'>
                      <div>
                        <span className='text-sm font-medium text-muted-foreground'>
                          ID:
                        </span>
                        <p className='text-sm font-semibold'>{reward.id}</p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-muted-foreground'>
                          Type:
                        </span>
                        <p className='text-sm font-semibold'>
                          {reward.type || 'N/A'}
                        </p>
                      </div>
                      {reward.title && (
                        <div>
                          <span className='text-sm font-medium text-muted-foreground'>
                            Title:
                          </span>
                          <p className='text-sm'>{reward.title}</p>
                        </div>
                      )}
                      {reward.value && (
                        <div>
                          <span className='text-sm font-medium text-muted-foreground'>
                            Value:
                          </span>
                          <p className='text-sm'>{reward.value}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Main>
    </div>
  )
}
