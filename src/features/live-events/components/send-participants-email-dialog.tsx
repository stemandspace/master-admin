'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { IconMail, IconCopy, IconCheck } from '@tabler/icons-react'
import { getLiveParticipants } from '@/utils/fetcher-functions'
import { sendZeptoMailBatch } from '@/utils/zeptomail'
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

export function SendParticipantsEmailDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const [curlCommand, setCurlCommand] = useState<string>('')
  const [copied, setCopied] = useState(false)

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

  // Generate curl command when participants are loaded
  useEffect(() => {
    if (participants && participants.length > 0) {
      const recipients = participants.map((participant: any) => {
        const user = participant.user || participant
        const email = user?.email || ''
        const name =
          `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
          user?.username ||
          'spacetopia user'

        return {
          email_address: {
            address: email,
            name: name,
          },
          merge_info: {},
        }
      })

      const emailPayload = {
        mail_template_key:
          import.meta.env.VITE_ZEPTOMAIL_PARTICIPANT_TEMPLATE_KEY ||
          '2518b.5ca07f11c3f3c129.k1.83301530-cb3f-11f0-8577-cabf48e1bf81.19ac3504603',
        from: {
          address: 'noreply@spacetopia.in',
          name: 'noreply',
        },
        to: recipients,
      }

      // Format JSON with proper indentation to match curl format
      const jsonPayload = JSON.stringify(emailPayload, null, 8)
      const apiKey = import.meta.env.VITE_ZEPTOMAIL_API_KEY || '********'

      // Generate curl command matching the exact format requested
      const curlCmd = `curl "https://api.zeptomail.in/v1.1/email/template/batch" \\
        -X POST \\
        -H "Accept: application/json" \\
        -H "Content-Type: application/json" \\
        -H "Authorization:Zoho-enczapikey ${apiKey}" \\
        -d '${jsonPayload}'`

      setCurlCommand(curlCmd)
    } else if (participants && participants.length === 0) {
      setCurlCommand('')
    }
  }, [participants])

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!participants || participants.length === 0) {
        throw new Error('No participants found')
      }

      const recipients = participants.map((participant: any) => {
        const user = participant.user || participant
        const email = user?.email || ''
        const name =
          `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
          user?.username ||
          'spacetopia user'

        return {
          email_address: {
            address: email,
            name: name,
          },
          merge_info: {},
        }
      })

      const mailTemplateKey =
        import.meta.env.VITE_ZEPTOMAIL_PARTICIPANT_TEMPLATE_KEY ||
        '2518b.5ca07f11c3f3c129.k1.83301530-cb3f-11f0-8577-cabf48e1bf81.19ac3504603'

      return await sendZeptoMailBatch({
        mailTemplateKey,
        recipients,
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Email sent successfully to ${participants?.length || 0} participants`,
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.message || 'Failed to send emails. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied',
        description: 'Curl command copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <IconMail size={20} />
            Send Email to Participants
          </DialogTitle>
          <DialogDescription>
            {participants && participants.length > 0 ? (
              <div className='flex items-center gap-2'>
                <span>Generate and send batch email to all participants.</span>
                <span className='font-medium text-foreground'>
                  ({participants.length} participant
                  {participants.length !== 1 ? 's' : ''})
                </span>
              </div>
            ) : (
              'No participants found for this live event.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isLoadingParticipants ? (
            <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
              Loading participants...
            </div>
          ) : participants && participants.length > 0 ? (
            <>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Full Curl Request
                  </label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleCopy}
                    className='gap-2'
                  >
                    {copied ? (
                      <>
                        <IconCheck size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <IconCopy size={16} />
                        Copy Curl
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className='h-[400px] rounded-md border p-4'>
                  <pre className='whitespace-pre-wrap break-words text-xs'>
                    <code>{curlCommand}</code>
                  </pre>
                </ScrollArea>
              </div>

              <div className='rounded-md bg-muted p-3 text-sm'>
                <p className='mb-1 font-medium'>Preview:</p>
                <ul className='list-inside list-disc space-y-1 text-muted-foreground'>
                  <li>
                    Template Key:{' '}
                    {import.meta.env.VITE_ZEPTOMAIL_PARTICIPANT_TEMPLATE_KEY ||
                      '2518b.5ca07f11c3f3c129.k1.83301530-cb3f-11f0-8577-cabf48e1bf81.19ac3504603'}
                  </li>
                  <li>From: noreply@spacetopia.in (noreply)</li>
                  <li>
                    Recipients: {participants.length} participant
                    {participants.length !== 1 ? 's' : ''}
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
              No participants available
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type='button'
            onClick={() => sendEmailMutation.mutate()}
            disabled={
              sendEmailMutation.isPending ||
              !participants ||
              participants.length === 0 ||
              isLoadingParticipants
            }
          >
            {sendEmailMutation.isPending
              ? 'Sending...'
              : `Send Email to ${participants?.length || 0} Participants`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
