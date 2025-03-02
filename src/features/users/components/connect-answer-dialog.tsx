'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { getDjAnswers } from '@/utils/fetcher-functions'
import strapi from '@/utils/strapi'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectAnswerDialog({ open, onOpenChange }: Props) {
  const [ans, setAns] = useState() as any

  const { unmarkAll } = useMark()
  const { data: answers, isLoading } = useQuery({
    queryKey: ['answers'],
    queryFn: async () => await getDjAnswers(),
  })
  if (isLoading) {
    return <div>Loading...</div>
  }
  const { storage } = useMark()
  console.log(answers)

  const handleConnect = async () => {
    if (!storage.length || !ans) {
      console.error('Missing question IDs or answer ID')
      return
    }

    try {
      await Promise.all(
        storage.map((id) =>
          strapi.put(`/discovery-jar-questions/${id}`, {
            answer: ans,
          })
        )
      )
      console.log('All questions updated successfully!')
      unmarkAll()
    } catch (error) {
      console.error('Error updating questions:', error)
    } finally {
      onOpenChange(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[95%] rounded-lg p-6 md:max-w-lg'>
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
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                Total Questions:
              </h3>
              <p className='rounded-md bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                {storage?.length ?? 0}
              </p>
            </div>
            <div className='flex flex-col gap-2'>
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
          </ScrollArea>
        )}
        <DialogFooter className='flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleConnect()}>Connect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
