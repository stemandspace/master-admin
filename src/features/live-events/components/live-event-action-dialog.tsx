'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLiveEvent,
  updateLiveEvent,
  getLives,
  getUsers,
  getLiveParticipants,
} from '@/utils/fetcher-functions'
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
import { RewardIdSelector } from '@/components/reward-id-selector'
import { SelectDropdown } from '@/components/select-dropdown'
import { LiveEvent } from '../data/schema'

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  winners_rewarded: z.boolean().optional(),
  participations_rewarded: z.boolean().optional(),
  live: z.string().optional(),
  winners_rewards: z.array(z.string()).optional(),
  participation_rewards: z.array(z.string()).optional(),
  winners: z.array(z.string()).optional(),
})

type LiveEventForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: LiveEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LiveEventActionDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const { data: lives, isLoading: isLoadingLives } = useQuery({
    queryKey: ['lives'],
    queryFn: async () => await getLives(),
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => await getUsers(),
  })

  const { data: _participants } = useQuery({
    queryKey: ['live-participants', currentRow?.live?.id?.toString()],
    queryFn: async () =>
      await getLiveParticipants({
        liveId: currentRow?.live?.id?.toString() || '',
      }),
    enabled: !!currentRow?.live?.id?.toString(),
  })

  const form = useForm<LiveEventForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          title: currentRow.title || '',
          winners_rewarded: currentRow.winners_rewarded || false,
          participations_rewarded: currentRow.participations_rewarded || false,
          live:
            currentRow.live && typeof currentRow.live === 'object'
              ? currentRow.live.id?.toString() || ''
              : currentRow.live?.toString() || '',
          winners_rewards:
            currentRow.winners_rewards?.map((r: any) =>
              typeof r === 'object' ? r.id?.toString() : r?.toString()
            ) || [],
          participation_rewards:
            currentRow.participation_rewards?.map((r: any) =>
              typeof r === 'object' ? r.id?.toString() : r?.toString()
            ) || [],
          winners:
            currentRow.winners?.map((w: any) =>
              typeof w === 'object' ? w.id?.toString() : w?.toString()
            ) || [],
        }
      : {
          title: '',
          winners_rewarded: false,
          participations_rewarded: false,
          live: '',
          winners_rewards: [],
          participation_rewards: [],
          winners: [],
        },
  })

  // Reset form when dialog opens or currentRow changes
  useEffect(() => {
    if (open) {
      if (isEdit && currentRow) {
        form.reset({
          title: currentRow.title || '',
          winners_rewarded: currentRow.winners_rewarded || false,
          participations_rewarded: currentRow.participations_rewarded || false,
          live:
            currentRow.live && typeof currentRow.live === 'object'
              ? currentRow.live.id?.toString() || ''
              : currentRow.live?.toString() || '',
          winners_rewards:
            currentRow.winners_rewards
              ?.map((r: any) => {
                if (r === null || r === undefined) return ''
                if (typeof r === 'object') {
                  return r.id?.toString() || String(r.id) || ''
                }
                // Handle number or string IDs directly
                return String(r)
              })
              .filter((id: string) => id !== '') || [],
          participation_rewards:
            currentRow.participation_rewards
              ?.map((r: any) => {
                if (r === null || r === undefined) return ''
                if (typeof r === 'object') {
                  return r.id?.toString() || String(r.id) || ''
                }
                // Handle number or string IDs directly
                return String(r)
              })
              .filter((id: string) => id !== '') || [],
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
          title: '',
          winners_rewarded: false,
          participations_rewarded: false,
          live: '',
          winners_rewards: [],
          participation_rewards: [],
          winners: [],
        })
      }
    }
  }, [open, currentRow, isEdit, form])

  const createMutation = useMutation({
    mutationFn: createLiveEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
      form.reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateLiveEvent({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
      form.reset()
      onOpenChange(false)
    },
  })

  const onSubmit = (values: LiveEventForm) => {
    const submitData: any = {
      title: values.title,
      winners_rewarded: values.winners_rewarded,
      participations_rewarded: values.participations_rewarded,
    }

    // Handle live relation - convert string to number or set to null if empty
    if (values.live && values.live !== '') {
      submitData.live = Number(values.live)
    } else if (isEdit) {
      // When editing, if live is cleared, set it to null to disconnect the relation
      submitData.live = null
    }

    // Handle arrays - convert string arrays to number arrays
    if (values.winners_rewards && values.winners_rewards.length > 0) {
      submitData.winners_rewards = values.winners_rewards.map((id) =>
        Number(id)
      )
    }
    if (
      values.participation_rewards &&
      values.participation_rewards.length > 0
    ) {
      submitData.participation_rewards = values.participation_rewards.map(
        (id) => Number(id)
      )
    }
    if (values.winners && values.winners.length > 0) {
      submitData.winners = values.winners.map((id) => Number(id))
    }

    if (isEdit && currentRow) {
      updateMutation.mutate({
        id: currentRow.id,
        data: submitData,
      })
    } else {
      createMutation.mutate(submitData)
    }
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
            {isEdit ? 'Edit Live Event' : 'Add New Live Event'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the live event here. '
              : 'Create new live event here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='-mr-4 h-[32rem] w-full py-1 pr-4'>
          <Form {...form}>
            <form
              id='live-event-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-right'>
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Live Event Title'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='winners_rewarded'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-right'>
                      Winners Rewarded
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-sm text-muted-foreground'>
                          Mark if winners have been rewarded
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='participations_rewarded'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-right'>
                      Participations Rewarded
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center space-x-2'>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className='text-sm text-muted-foreground'>
                          Mark if participations have been rewarded
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='live'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-right'>
                      Live
                    </FormLabel>
                    <FormControl>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a live'
                        className='col-span-4'
                        isPending={isLoadingLives}
                        items={lives?.map((live: any) => ({
                          label: live.title || `Live #${live.id}`,
                          value: live.id?.toString() || '',
                        }))}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='winners_rewards'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-right'>
                      Winners Rewards
                    </FormLabel>
                    <FormControl>
                      <RewardIdSelector
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder='Enter reward ID'
                        className='col-span-4'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='participation_rewards'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-right'>
                      Participation Rewards
                    </FormLabel>
                    <FormControl>
                      <RewardIdSelector
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder='Enter reward ID'
                        className='col-span-4'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='winners'
                render={({ field }) => {
                  const winnerIds = field.value || []
                  const winnerUsers = winnerIds
                    .map((id: string) => {
                      const user = users?.find(
                        (u: any) => u.id?.toString() === id.toString()
                      )
                      return user
                        ? {
                            id: user.id?.toString() || id,
                            email: user.email || 'N/A',
                          }
                        : { id: id.toString(), email: 'N/A' }
                    })
                    .filter((w: any) => w !== null)

                  return (
                    <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 pt-2 text-right'>
                        Winners
                      </FormLabel>
                      <FormControl>
                        <div className='col-span-4'>
                          {winnerUsers.length > 0 ? (
                            <div className='space-y-2 rounded-md border bg-muted/50 p-3'>
                              {winnerUsers.map((winner: any, index: number) => (
                                <div
                                  key={winner.id || index}
                                  className='flex items-center justify-between text-sm'
                                >
                                  <span className='font-medium'>
                                    ID: {winner.id}
                                  </span>
                                  <span className='ml-4 text-muted-foreground'>
                                    {winner.email}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className='rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground'>
                              No winners selected. Use the &quot;Select
                              Winners&quot; button to choose winners from
                              participants.
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )
                }}
              />
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter>
          <Button
            type='submit'
            form='live-event-form'
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
