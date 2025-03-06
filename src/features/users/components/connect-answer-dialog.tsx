'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  ConnectDjQuestionsWithAnswer,
  getConfigRewards,
  getDjAnswers,
} from '@/utils/fetcher-functions'
import useMark from '@/hooks/use-mark'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectAnswerDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const search: {
    theme?: string
  } = useSearch({ from: '/_authenticated/users/' })

  const id = search?.theme || ''


  const [ans, setAns] = useState() as any
  const [isConnecting, setIsConnecting] = useState(false)
  const { unmarkAll, storage } = useMark()

  const { data: answers, isLoading } = useQuery({
    queryKey: ['answers'],
    queryFn: async () => await getDjAnswers(),
  })


  const { data: rewards } = useQuery({
    queryKey: ['disconvery-jar-config-rewards', id],
    queryFn: async () => await getConfigRewards({ id }),
    enabled: !!id,
  })


  const handleConnect = async () => {
    if (!storage.length || !ans) {
      console.error('Missing question IDs or answer ID')
      return
    }

    try {
      setIsConnecting(true)
      const stringArray = storage.map(String)
      const rewardIds = rewards.map((r: any) => r.id) || []
      await ConnectDjQuestionsWithAnswer({ qIds: stringArray, aId: ans, rewardIds: rewardIds })
      //@ts-ignore
      queryClient.invalidateQueries(['discovery_jar_quetions', id]);
      unmarkAll()
    } catch (error) {
      console.log('Error updating questions:', error)
    } finally {
      onOpenChange(false)
      setIsConnecting(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[95%] rounded-lg p-6 md:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Connect Answers
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className='flex h-40 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-gray-500' />
          </div>
        ) : (
          <ScrollArea className='max-h-[22rem] space-y-4'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                Total Questions:
              </h3>
              <p className='rounded-md bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                {storage?.length ?? 0}
              </p>
            </div>
            <div className='flex flex-col gap-2 px-2'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                Select Answer:
              </h3>
              <select
                className='w-full rounded-md px-3 py-2'
                onChange={(e) => setAns(e.target.value)}
              >
                {answers?.length > 0 &&
                  answers?.map((answer: any) => (
                    <option key={answer.id} value={answer.id}>
                      {answer?.title}
                    </option>
                  ))}
              </select>
            </div>
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
          </ScrollArea>
        )}
        <DialogFooter className='flex justify-end gap-2'>
          <Button variant='outline' disabled={isConnecting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleConnect()} disabled={isConnecting}>{isConnecting ? "Connect..." : "Connect"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
