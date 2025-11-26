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
import { MultiSelect } from '@/components/multi-select'
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
  participants: z.array(z.string()).optional(),
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

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => await getUsers(),
  })

  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
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
          participants:
            currentRow.participants?.map((p: any) =>
              typeof p === 'object' ? p.id?.toString() : p?.toString()
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
          participants: [],
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
          participants:
            currentRow.participants?.map((p: any) => {
              if (typeof p === 'object' && p !== null) {
                return p.id?.toString() || String(p.id) || ''
              }
              return String(p)
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
          participants: [],
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
    if (values.participants && values.participants.length > 0) {
      submitData.participants = values.participants.map((id) => Number(id))
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
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-right'>
                      Winners
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={
                          users?.map((user: any) => ({
                            label:
                              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                              user.username ||
                              user.email ||
                              `User #${user.id}`,
                            value: user.id?.toString() || '',
                          })) || []
                        }
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder='Select winners'
                        className='col-span-4'
                        isPending={isLoadingUsers}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='participants'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-right'>
                      Participants
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={
                          users?.map((user: any) => ({
                            label:
                              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                              user.username ||
                              user.email ||
                              `User #${user.id}`,
                            value: user.id?.toString() || '',
                          })) || []
                        }
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder='Select participants'
                        className='col-span-4'
                        isPending={isLoadingUsers}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {participants && participants.length > 0 && (
            <div className='mt-4'>
              <div className='mb-2 font-semibold'>Event Participants</div>
              <ul className='list-disc pl-6 text-sm text-muted-foreground'>
                {participants.map((p: any) => (
                  <li key={p.id}>
                    {`${p.firstName || ''} ${p.lastName || ''}`.trim() ||
                      p.username ||
                      p.email ||
                      `User #${p.id}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
