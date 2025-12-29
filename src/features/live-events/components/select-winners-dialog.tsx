'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateLiveEvent, getLiveParticipants } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LiveEvent } from '../data/schema'

const formSchema = z.object({
  winners: z
    .array(z.string())
    .max(3, { message: 'You can select a maximum of 3 winners.' })
    .optional(),
})

type SelectWinnersForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: LiveEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SelectWinnersDialog({ currentRow, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  const liveId =
    currentRow?.live && typeof currentRow.live === 'object'
      ? currentRow.live.id?.toString() || ''
      : currentRow?.live?.toString() || ''

  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['live-participants', liveId],
    queryFn: async () =>
      await getLiveParticipants({
        liveId: liveId,
      }),
    enabled: !!liveId && open,
  })

  const form = useForm<SelectWinnersForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      winners: [],
    },
  })

  // Reset form and search when dialog opens or currentRow changes
  useEffect(() => {
    if (open && currentRow) {
      form.reset({
        winners:
          currentRow.winners?.map((w: any) => {
            if (typeof w === 'object' && w !== null) {
              return w.id?.toString() || String(w.id) || ''
            }
            return String(w)
          }) || [],
      })
    } else {
      form.reset({
        winners: [],
      })
    }
    setSearchQuery('')
  }, [open, currentRow, form])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateLiveEvent({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
      form.reset()
      onOpenChange(false)
    },
  })

  const onSubmit = (values: SelectWinnersForm) => {
    if (!currentRow || !participants) return

    const submitData: any = {}

    // Handle winners array - convert string array to number array (selected winners only)
    if (values.winners && values.winners.length > 0) {
      submitData.winners = values.winners.map((id) => Number(id))
    } else {
      submitData.winners = []
    }

    // Update participants array with ALL participants from the live event
    const allParticipantIds =
      participants
        ?.map((participant: any) => {
          const user = participant.user || participant
          return user?.id ? Number(user.id) : null
        })
        .filter((id: number | null) => id !== null) || []

    submitData.participants = allParticipantIds

    updateMutation.mutate({
      id: currentRow.id,
      data: submitData,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>
            Select Winners from list of Content Purchasers
          </DialogTitle>
          <DialogDescription>
            {participants && participants.length > 0 ? (
              <div className='flex items-center gap-2'>
                <span>Select up to 3 winners from the participants list.</span>
                <span className='font-medium text-foreground'>
                  ({participants.length} Content Purchaser
                  {participants.length !== 1 ? 's' : ''})
                </span>
              </div>
            ) : (
              'No Content Purchasers found for this live event.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='select-winners-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='winners'
              render={({ field }) => {
                const selectedWinners = field.value || []
                const maxReached = selectedWinners.length >= 3

                const handleToggle = (userId: string) => {
                  const isSelected = selectedWinners.includes(userId)
                  if (isSelected) {
                    // Remove from selection
                    field.onChange(
                      selectedWinners.filter((id: string) => id !== userId)
                    )
                  } else {
                    // Add to selection if under limit
                    if (selectedWinners.length < 3) {
                      field.onChange([...selectedWinners, userId])
                    }
                  }
                }

                const participantList =
                  participants
                    ?.map((participant: any) => {
                      const user = participant.user || participant
                      if (!user?.id) return null
                      return {
                        id: user.id.toString(),
                        name:
                          `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
                          user?.username ||
                          user?.email ||
                          `User #${user.id}`,
                        email: user?.email || '',
                        username: user?.username || '',
                      }
                    })
                    .filter((p: any) => p !== null) || []

                // Filter participants based on search query
                const filteredParticipants = participantList.filter(
                  (participant: any) => {
                    if (!searchQuery.trim()) return true
                    const query = searchQuery.toLowerCase()
                    return (
                      participant.name.toLowerCase().includes(query) ||
                      participant.email.toLowerCase().includes(query) ||
                      participant.username.toLowerCase().includes(query)
                    )
                  }
                )

                return (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Select Winners (Max 3)
                    </FormLabel>
                    <FormControl>
                      {isLoadingParticipants ? (
                        <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
                          Loading participants...
                        </div>
                      ) : participantList.length === 0 ? (
                        <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
                          No participants available
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          <div className='space-y-2'>
                            <Input
                              placeholder='Search participants by name, email, or username...'
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className='w-full'
                            />
                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                              <span>
                                Showing {filteredParticipants.length} of{' '}
                                {participantList.length} entr
                                {participantList.length !== 1 ? 'ies' : 'y'}
                              </span>
                              {searchQuery.trim() && (
                                <span className='text-primary'>
                                  {filteredParticipants.length ===
                                  participantList.length
                                    ? 'All results'
                                    : 'Filtered'}
                                </span>
                              )}
                            </div>
                          </div>
                          <ScrollArea className='h-[300px] rounded-md border p-4'>
                            <div className='space-y-3'>
                              {filteredParticipants.length === 0 ? (
                                <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
                                  No participants found matching &quot;
                                  {searchQuery}&quot;
                                </div>
                              ) : (
                                filteredParticipants.map((participant: any) => {
                                  const isSelected = selectedWinners.includes(
                                    participant.id
                                  )
                                  const isDisabled = !isSelected && maxReached

                                  return (
                                    <div
                                      key={participant.id}
                                      className='flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50'
                                    >
                                      <Checkbox
                                        id={`participant-${participant.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          handleToggle(participant.id)
                                        }
                                        disabled={isDisabled}
                                      />
                                      <label
                                        htmlFor={`participant-${participant.id}`}
                                        className={`flex-1 cursor-pointer text-sm ${
                                          isDisabled
                                            ? 'cursor-not-allowed text-muted-foreground'
                                            : ''
                                        }`}
                                      >
                                        <div className='font-medium'>
                                          {participant.name}
                                        </div>
                                        {participant.email && (
                                          <div className='text-xs text-muted-foreground'>
                                            {participant.email}
                                          </div>
                                        )}
                                      </label>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </FormControl>
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{selectedWinners.length} of 3 selected</span>
                      {maxReached && (
                        <span className='text-amber-600 dark:text-amber-500'>
                          Maximum reached
                        </span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type='submit'
            form='select-winners-form'
            disabled={
              updateMutation.isPending ||
              !participants ||
              participants.length === 0
            }
          >
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
