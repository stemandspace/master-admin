'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getLiveParticipants,
  updateLiveEvent,
  getRewardById,
} from '@/utils/fetcher-functions'
import strapi from '@/utils/strapi'
import { sendWinnerEmails, sendParticipantEmails } from '@/utils/zeptomail'
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
  const [isProcessingWinners, setIsProcessingWinners] = useState(false)
  const [isProcessingParticipants, setIsProcessingParticipants] =
    useState(false)

  const liveId =
    currentRow?.live && typeof currentRow.live === 'object'
      ? currentRow.live.id?.toString() || ''
      : currentRow?.live?.toString() || ''

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
    if (!currentRow?.winners) return []
    return currentRow.winners
      .map((winner: any) => {
        // Handle both object and string/ID formats
        const winnerObj =
          typeof winner === 'object' && winner !== null ? winner : null

        if (!winnerObj) {
          return {
            id: String(winner),
            email: 'N/A',
            name: 'N/A',
          }
        }

        // Extract data directly from winner object
        const id =
          winnerObj.id?.toString() ||
          winnerObj.user?.id?.toString() ||
          winnerObj.userId?.toString() ||
          'N/A'

        const email =
          winnerObj.email ||
          winnerObj.user?.email ||
          winnerObj.userEmail ||
          'N/A'

        const name =
          winnerObj.name ||
          winnerObj.userName ||
          winnerObj.user?.name ||
          (winnerObj.firstName || winnerObj.lastName
            ? `${winnerObj.firstName || ''} ${winnerObj.lastName || ''}`.trim()
            : null) ||
          (winnerObj.user?.firstName || winnerObj.user?.lastName
            ? `${winnerObj.user.firstName || ''} ${winnerObj.user.lastName || ''}`.trim()
            : null) ||
          winnerObj.username ||
          winnerObj.user?.username ||
          'N/A'

        return {
          id,
          email,
          name,
        }
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

  const handleSendWinnersRewards = async () => {
    if (!currentRow) return

    setIsProcessingWinners(true)

    try {
      const winnerIds =
        currentRow.winners?.map((w: any) =>
          typeof w === 'object' && w !== null ? w.id?.toString() : w?.toString()
        ) || []

      if (winnerRewardIds.length === 0 || winnerIds.length === 0) {
        toast({
          title: 'Error',
          description: 'No winners or rewards configured',
          variant: 'destructive',
        })
        return
      }

      const rewardIds = winnerRewardIds.map((id) => Number(id))
      await sendRewards(winnerIds, rewardIds)

      // Send ZeptoMail emails to winners
      let emailStatus = { sent: false, count: 0, error: null as string | null }
      try {
        if (!currentRow.winners || currentRow.winners.length === 0) {
          console.warn('No winners found in currentRow')
          emailStatus.error = 'No winners found'
        } else {
          // Get winner users with email addresses directly from currentRow.winners
          const winnerUsersForEmail = currentRow.winners
            .map((winner: any) => {
              // Handle both object and string/ID formats
              const winnerObj =
                typeof winner === 'object' && winner !== null ? winner : null

              if (!winnerObj) {
                console.warn('Invalid winner format:', winner)
                return null
              }

              // Extract email from winner object (could be winner.email, winner.user?.email, etc.)
              const email =
                winnerObj.email ||
                winnerObj.user?.email ||
                winnerObj.userEmail ||
                null

              // Extract name from winner object
              const name =
                winnerObj.name ||
                winnerObj.userName ||
                winnerObj.user?.name ||
                (winnerObj.firstName || winnerObj.lastName
                  ? `${winnerObj.firstName || ''} ${winnerObj.lastName || ''}`.trim()
                  : null) ||
                (winnerObj.user?.firstName || winnerObj.user?.lastName
                  ? `${winnerObj.user.firstName || ''} ${winnerObj.user.lastName || ''}`.trim()
                  : null) ||
                winnerObj.username ||
                winnerObj.user?.username ||
                'User'

              // Extract ID
              const id =
                winnerObj.id?.toString() ||
                winnerObj.user?.id?.toString() ||
                winnerObj.userId?.toString() ||
                null

              if (!email || email === 'N/A') {
                console.warn(`No valid email for winner:`, winnerObj)
                return null
              }

              if (!id) {
                console.warn(`No valid ID for winner:`, winnerObj)
                return null
              }

              return {
                id,
                email,
                name: name || 'User',
              }
            })
            .filter(
              (user): user is { id: string; email: string; name: string } =>
                user !== null
            )

          if (winnerUsersForEmail.length > 0) {
            console.log('Sending ZeptoMail to winners:', winnerUsersForEmail)
            await sendWinnerEmails(winnerUsersForEmail)
            console.log('ZeptoMail sent successfully to winners')
            emailStatus.sent = true
            emailStatus.count = winnerUsersForEmail.length
          } else {
            console.warn('No valid email addresses found for winners')
            emailStatus.error = 'No valid email addresses found'
          }
        }
      } catch (emailError) {
        console.error('Error sending winner emails:', emailError)
        emailStatus.error =
          emailError instanceof Error ? emailError.message : 'Unknown error'
        // Don't fail the whole operation if email fails, just log it
      }

      // Update winners_rewarded to true after successful reward distribution
      await updateLiveEvent({
        id: currentRow.id,
        data: {
          winners_rewarded: true,
        },
      })

      // Show success message with email status
      const successMessage = emailStatus.sent
        ? `Winners rewards and emails sent successfully to ${emailStatus.count} winner(s)`
        : emailStatus.error
          ? `Winners rewards sent successfully. Email notification skipped: ${emailStatus.error}`
          : 'Winners rewards sent successfully'

      toast({
        title: 'Success',
        description: successMessage,
      })

      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    } catch (error) {
      console.error('Error sending winners rewards:', error)

      // Update winners_rewarded to false if there's an API error
      try {
        await updateLiveEvent({
          id: currentRow.id,
          data: {
            winners_rewarded: false,
          },
        })
        queryClient.invalidateQueries({ queryKey: ['live-events'] })
      } catch (updateError) {
        console.error('Error updating winners_rewarded flag:', updateError)
      }

      toast({
        title: 'Error',
        description: 'Failed to send winners rewards',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingWinners(false)
    }
  }

  const handleSendParticipantsRewards = async () => {
    if (!currentRow) return

    setIsProcessingParticipants(true)

    try {
      const participantIds = getParticipantUsers().map((p: any) => p.id)

      if (participationRewardIds.length === 0 || participantIds.length === 0) {
        toast({
          title: 'Error',
          description: 'No participants or rewards configured',
          variant: 'destructive',
        })
        return
      }

      const rewardIds = participationRewardIds.map((id) => Number(id))
      await sendRewards(participantIds, rewardIds)

      // Send ZeptoMail emails to participants
      let emailStatus = { sent: false, count: 0, error: null as string | null }
      try {
        if (!participants || participants.length === 0) {
          console.warn(
            'Participants data not loaded yet, skipping email sending'
          )
          emailStatus.error = 'Participants data not loaded'
        } else {
          // Get participant users with email addresses for ZeptoMail
          const participantUsersForEmail = participantIds
            .map((participantId: string) => {
              const participant = participants.find(
                (p: any) =>
                  (p.user?.id?.toString() || p.id?.toString()) === participantId
              )
              if (!participant) {
                console.warn(`Participant not found for ID: ${participantId}`)
                return null
              }

              const user = participant.user || participant
              const userName =
                user.firstname || user.lastname
                  ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
                  : user.username || 'User'

              if (!user.email || user.email === 'N/A') {
                console.warn(
                  `No valid email for participant ID: ${participantId}`
                )
                return null
              }

              return {
                id: participantId,
                email: user.email,
                name: userName,
              }
            })
            .filter(
              (
                user: { id: string; email: string; name: string } | null
              ): user is { id: string; email: string; name: string } =>
                user !== null
            )

          if (participantUsersForEmail.length > 0) {
            console.log(
              'Sending ZeptoMail to participants:',
              participantUsersForEmail
            )
            await sendParticipantEmails(participantUsersForEmail)
            console.log('ZeptoMail sent successfully to participants')
            emailStatus.sent = true
            emailStatus.count = participantUsersForEmail.length
          } else {
            console.warn('No valid email addresses found for participants')
            emailStatus.error = 'No valid email addresses found'
          }
        }
      } catch (emailError) {
        console.error('Error sending participant emails:', emailError)
        emailStatus.error =
          emailError instanceof Error ? emailError.message : 'Unknown error'
        // Don't fail the whole operation if email fails, just log it
      }

      // Update participations_rewarded to true after successful reward distribution
      await updateLiveEvent({
        id: currentRow.id,
        data: {
          participations_rewarded: true,
        },
      })

      // Show success message with email status
      const successMessage = emailStatus.sent
        ? `Participants rewards and emails sent successfully to ${emailStatus.count} participant(s)`
        : emailStatus.error
          ? `Participants rewards sent successfully. Email notification skipped: ${emailStatus.error}`
          : 'Participants rewards sent successfully'

      toast({
        title: 'Success',
        description: successMessage,
      })

      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    } catch (error) {
      console.error('Error sending participants rewards:', error)

      // Update participations_rewarded to false if there's an API error
      try {
        await updateLiveEvent({
          id: currentRow.id,
          data: {
            participations_rewarded: false,
          },
        })
        queryClient.invalidateQueries({ queryKey: ['live-events'] })
      } catch (updateError) {
        console.error(
          'Error updating participations_rewarded flag:',
          updateError
        )
      }

      toast({
        title: 'Error',
        description: 'Failed to send participants rewards',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingParticipants(false)
    }
  }

  // Check if winners and participants are already rewarded
  const winnersRewarded = currentRow?.winners_rewarded || false
  const participationsRewarded = currentRow?.participations_rewarded || false

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

                    <div className='mt-4'>
                      <Button
                        type='button'
                        onClick={handleSendWinnersRewards}
                        disabled={
                          isProcessingWinners ||
                          winnersRewarded ||
                          !currentRow?.winners ||
                          currentRow.winners.length === 0 ||
                          winnerRewardIds.length === 0
                        }
                        className='w-full'
                      >
                        {isProcessingWinners
                          ? 'Sending Rewards...'
                          : winnersRewarded
                            ? 'Winners Already Rewarded'
                            : 'Send Rewards to Winners'}
                      </Button>
                    </div>
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
                    <div className='mt-4'>
                      <Button
                        type='button'
                        onClick={handleSendParticipantsRewards}
                        disabled={
                          isProcessingParticipants ||
                          participationsRewarded ||
                          !participants ||
                          participants.length === 0 ||
                          participationRewardIds.length === 0
                        }
                        className='w-full'
                      >
                        {isProcessingParticipants
                          ? 'Sending Rewards...'
                          : participationsRewarded
                            ? 'Participants Already Rewarded'
                            : 'Send Rewards to Participants'}
                      </Button>
                    </div>
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
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
