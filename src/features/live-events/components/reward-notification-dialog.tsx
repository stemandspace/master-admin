'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { WINNER_TEMPLATE_ID, APPROVED_TEMPLATE_ID } from '@/lib/templateIds'
import {
  getUsers,
  getLiveParticipants,
  updateLiveEvent,
  getRewardById,
} from '@/utils/fetcher-functions'
import strapi from '@/utils/strapi'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { LiveEvent } from '../data/schema'

interface Props {
  currentRow?: LiveEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RewardNotificationDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)

  const liveId =
    currentRow?.live && typeof currentRow.live === 'object'
      ? currentRow.live.id?.toString() || ''
      : currentRow?.live?.toString() || ''

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => await getUsers(),
  })

  const { data: participants } = useQuery({
    queryKey: ['live-participants', liveId],
    queryFn: async () =>
      await getLiveParticipants({
        liveId: liveId,
      }),
    enabled: !!liveId && open,
  })

  // Get winner reward IDs
  const winnerRewardIds =
    currentRow?.winners_rewards?.map((r: any) =>
      typeof r === 'object' && r !== null ? r.id?.toString() : r?.toString()
    ) || []

  // Get participation reward IDs
  const participationRewardIds =
    currentRow?.participation_rewards?.map((r: any) =>
      typeof r === 'object' && r !== null ? r.id?.toString() : r?.toString()
    ) || []

  // Fetch winner rewards data
  const { data: winnerRewards } = useQuery({
    queryKey: ['winner-rewards', winnerRewardIds.join(',')],
    queryFn: async () => {
      if (winnerRewardIds.length === 0) return []
      return Promise.all(
        winnerRewardIds.map((id: string) => getRewardById({ id }))
      )
    },
    enabled: open && winnerRewardIds.length > 0,
  })

  // Fetch participation rewards data
  const { data: participationRewards } = useQuery({
    queryKey: ['participation-rewards', participationRewardIds.join(',')],
    queryFn: async () => {
      if (participationRewardIds.length === 0) return []
      return Promise.all(
        participationRewardIds.map((id: string) => getRewardById({ id }))
      )
    },
    enabled: open && participationRewardIds.length > 0,
  })

  const getWinnerUsers = () => {
    if (!currentRow?.winners || !users) return []
    return currentRow.winners
      .map((w: any) => {
        const winnerId =
          typeof w === 'object' && w !== null ? w.id?.toString() : w?.toString()
        const user = users.find((u: any) => u.id?.toString() === winnerId)
        return user
          ? {
              id: user.id?.toString(),
              email: user.email || 'N/A',
              name:
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.username ||
                'N/A',
            }
          : null
      })
      .filter((w: any) => w !== null)
  }

  const getParticipantUsers = () => {
    if (!participants) return []
    return participants
      .map((participant: any) => {
        const user = participant.user || participant
        if (!user?.id) return null
        return {
          id: user.id.toString(),
          email: user?.email || 'N/A',
          name:
            `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
            user?.username ||
            'N/A',
        }
      })
      .filter((p: any) => p !== null)
  }

  const sendRewards = async (userIds: string[], rewardIds: number[]) => {
    if (rewardIds.length === 0) return

    await Promise.all(
      userIds.map(async (userId) => {
        await strapi.post(`/v1/reward`, {
          userId: Number(userId),
          rewardIds,
        })
      })
    )
  }

  // Check if both winners and participants are already rewarded
  const winnersRewarded = currentRow?.winners_rewarded || false
  const participationsRewarded = currentRow?.participations_rewarded || false
  const bothRewarded = winnersRewarded && participationsRewarded

  const sendNotifications = async (
    userIds: string[],
    templateId: number,
    eventTitle: string
  ) => {
    await Promise.all(
      userIds.map(async (userId) => {
        const user = users?.find((u: any) => u.id?.toString() === userId)
        const userName =
          user && `${user.firstName || ''} ${user.lastName || ''}`.trim()
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : user?.username || 'User'
        const userEmail = user?.email || ''

        await strapi.post('/notificationxes', {
          mail_template: templateId,
          channel: 'mail',
          user: Number(userId),
          variables: {
            variables: {
              challenge_link: 'challenge_link_value',
              challenge_name: eventTitle,
              name: userName,
            },
            name: userName,
            email: userEmail,
          },
        })
      })
    )
  }

  const onSubmit = async () => {
    if (!currentRow) return

    setIsProcessing(true)
    const eventTitle = currentRow.title || 'Live Event'

    try {
      const winnerIds =
        currentRow.winners?.map((w: any) =>
          typeof w === 'object' && w !== null ? w.id?.toString() : w?.toString()
        ) || []

      const participantIds = getParticipantUsers().map((p: any) => p.id)

      let winnersRewardedUpdated = winnersRewarded
      let participationsRewardedUpdated = participationsRewarded

      // Send winners rewards if configured and not already rewarded
      if (
        !winnersRewarded &&
        winnerRewardIds.length > 0 &&
        winnerIds.length > 0
      ) {
        const rewardIds = winnerRewardIds.map((id) => Number(id))
        await sendRewards(winnerIds, rewardIds)
        await sendNotifications(winnerIds, WINNER_TEMPLATE_ID, eventTitle)
        winnersRewardedUpdated = true
      }

      // Send participation rewards if configured and not already rewarded
      if (
        !participationsRewarded &&
        participationRewardIds.length > 0 &&
        participantIds.length > 0
      ) {
        const rewardIds = participationRewardIds.map((id) => Number(id))
        await sendRewards(participantIds, rewardIds)
        await sendNotifications(
          participantIds,
          APPROVED_TEMPLATE_ID,
          eventTitle
        )
        participationsRewardedUpdated = true
      }

      // Update the boolean flags if they changed
      if (
        winnersRewardedUpdated !== winnersRewarded ||
        participationsRewardedUpdated !== participationsRewarded
      ) {
        await updateLiveEvent({
          id: currentRow.id,
          data: {
            winners_rewarded: winnersRewardedUpdated,
            participations_rewarded: participationsRewardedUpdated,
          },
        })
      }

      toast({
        title: 'Success',
        description: 'Rewards and notifications sent successfully',
      })

      queryClient.invalidateQueries({ queryKey: ['live-events'] })
      onOpenChange(false)
    } catch (error) {
      console.error('Error sending rewards/notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to send rewards and notifications',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const winnerUsers = getWinnerUsers()
  const participantUsers = getParticipantUsers()

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>Reward & Notification</DialogTitle>
          <DialogDescription>
            Send rewards and notifications to winners and participants of this
            live event.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='-mr-4 h-[32rem] w-full py-1 pr-4'>
          <div className='space-y-6 p-0.5'>
            {/* Winners Section */}
            <div className='space-y-4'>
              <div className='rounded-lg border p-4'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Winners</h3>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      Winners Rewarded:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        winnersRewarded
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {winnersRewarded ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {winnerUsers.length > 0 ? (
                  <div className='mb-4 space-y-2'>
                    <p className='mb-2 text-sm font-medium'>
                      Winner Users ({winnerUsers.length}):
                    </p>
                    {winnerUsers.map((winner: any) => (
                      <div
                        key={winner.id}
                        className='flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm'
                      >
                        <span className='font-medium'>ID: {winner.id}</span>
                        <span className='text-muted-foreground'>
                          {winner.email}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='mb-4 text-sm text-muted-foreground'>
                    No winners selected for this event.
                  </p>
                )}

                {/* Winners Rewards Display */}
                {winnerRewardIds.length > 0 ? (
                  <div className='mt-4'>
                    <h4 className='mb-2 text-sm font-semibold'>
                      Winners Rewards:
                    </h4>
                    {winnerRewards && winnerRewards.length > 0 ? (
                      <div className='space-y-2'>
                        {winnerRewards.map((reward: any) => (
                          <div
                            key={reward.id}
                            className='rounded-md border bg-muted/50 p-3 text-sm'
                          >
                            <div className='mb-2 flex items-center gap-2'>
                              <span className='rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary'>
                                {reward.type || 'N/A'}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                ID: {reward.id}
                              </span>
                            </div>
                            <div className='grid gap-1 md:grid-cols-2'>
                              {reward.title && (
                                <div>
                                  <span className='font-semibold'>Title: </span>
                                  <span className='text-muted-foreground'>
                                    {reward.title}
                                  </span>
                                </div>
                              )}
                              {reward.value && (
                                <div>
                                  <span className='font-semibold'>Value: </span>
                                  <span className='text-muted-foreground'>
                                    {reward.value}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Loading reward details...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className='mt-4 text-sm text-muted-foreground'>
                    No rewards configured for winners.
                  </p>
                )}
              </div>

              {/* Participants Section */}
              <div className='rounded-lg border p-4'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Participants</h3>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      Participations Rewarded:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        participationsRewarded
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {participationsRewarded ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {participantUsers.length > 0 ? (
                  <div className='mb-4'>
                    <p className='text-sm text-muted-foreground'>
                      {participantUsers.length} participant(s) found
                    </p>
                  </div>
                ) : (
                  <p className='mb-4 text-sm text-muted-foreground'>
                    No participants found for this event.
                  </p>
                )}

                {/* Participation Rewards Display */}
                {participationRewardIds.length > 0 ? (
                  <div className='mt-4'>
                    <h4 className='mb-2 text-sm font-semibold'>
                      Participation Rewards:
                    </h4>
                    {participationRewards && participationRewards.length > 0 ? (
                      <div className='space-y-2'>
                        {participationRewards.map((reward: any) => (
                          <div
                            key={reward.id}
                            className='rounded-md border bg-muted/50 p-3 text-sm'
                          >
                            <div className='mb-2 flex items-center gap-2'>
                              <span className='rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary'>
                                {reward.type || 'N/A'}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                ID: {reward.id}
                              </span>
                            </div>
                            <div className='grid gap-1 md:grid-cols-2'>
                              {reward.title && (
                                <div>
                                  <span className='font-semibold'>Title: </span>
                                  <span className='text-muted-foreground'>
                                    {reward.title}
                                  </span>
                                </div>
                              )}
                              {reward.value && (
                                <div>
                                  <span className='font-semibold'>Value: </span>
                                  <span className='text-muted-foreground'>
                                    {reward.value}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Loading reward details...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className='mt-4 text-sm text-muted-foreground'>
                    No rewards configured for participants.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          {bothRewarded ? (
            <div className='flex w-full flex-col items-center gap-2'>
              <p className='text-sm text-muted-foreground'>
                Both winners and participants have already been rewarded.
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <Button
              type='button'
              onClick={onSubmit}
              disabled={isProcessing || bothRewarded}
            >
              {isProcessing ? 'Sending...' : 'Send Rewards & Notifications'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
