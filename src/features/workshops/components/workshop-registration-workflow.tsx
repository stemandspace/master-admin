import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock, Minus } from 'lucide-react'
import { getWorkshopProgramSchedules } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WorkshopRegistrationWorkflowProps {
  registration: any
}

type StepStatus = 'done' | 'pending' | 'skipped'

interface WorkflowStep {
  id: string
  label: string
  description: string
  status: StepStatus
  meta?: string
}

export function WorkshopRegistrationWorkflow({
  registration,
}: WorkshopRegistrationWorkflowProps) {
  const registrationId = registration?.id ? String(registration.id) : undefined
  const [activeStepId, setActiveStepId] = useState<string | null>(null)

  const workshopPrograms = Array.isArray(registration?.workshop_programs)
    ? registration.workshop_programs
    : []

  const workshopProgramIds = workshopPrograms
    .map((p: any) => p?.id ?? p?.documentId)
    .filter(Boolean)

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: [
      'workshop-program-schedules',
      registrationId,
      workshopProgramIds.join(','),
    ],
    queryFn: async () =>
      await getWorkshopProgramSchedules({
        workshopRegistrationId: registrationId,
        workshopProgramIds,
      }),
    enabled: Boolean(registrationId),
  })

  const steps: WorkflowStep[] = useMemo(() => {
    const hasRegistration = Boolean(registrationId)

    const hasAddons =
      Array.isArray(registration?.addons) && registration.addons.length > 0

    const registrationNotifications =
      Array.isArray(registration?.notifications) &&
      registration.notifications.length > 0

    const registrationNotificationSent =
      registration?.registration_notification_sent === true ||
      registrationNotifications

    const addonNotificationSent =
      hasAddons &&
      Array.isArray(registration?.notifications) &&
      registration.notifications.some((n: any) => {
        const type =
          n?.type ??
          n?.category ??
          n?.kind ??
          (typeof n?.name === 'string' ? n.name : '')
        return typeof type === 'string' && type.toLowerCase().includes('addon')
      })

    const schedulesArr = Array.isArray(schedules) ? schedules : []
    const hasSchedules = schedulesArr.length > 0

    const attendanceDone =
      registration?.attendance_marked === true ||
      registration?.attended === true ||
      (Array.isArray(registration?.attendance) &&
        registration.attendance.length > 0)

    const certificationDone =
      registration?.certificate_issued === true ||
      typeof registration?.certificate_url === 'string'

    const steps: WorkflowStep[] = [
      {
        id: 'registration',
        label: 'Registration completed',
        description: 'Registration entry exists in the system.',
        status: hasRegistration ? 'done' : 'pending',
        meta: registrationId ? `ID: ${registrationId}` : undefined,
      },
      {
        id: 'registration-notification',
        label: 'Registration notification',
        description: 'Notification/email sent to the registrant.',
        status: registrationNotificationSent ? 'done' : 'pending',
        meta: registrationNotificationSent
          ? 'Marked as sent from registration data.'
          : 'No explicit registration notification found.',
      },
      {
        id: 'addon-notification',
        label: 'Addon notification',
        description: 'Notification sent for any selected addons.',
        status: hasAddons
          ? addonNotificationSent
            ? 'done'
            : 'pending'
          : 'skipped',
        meta: hasAddons
          ? addonNotificationSent
            ? 'Addon notification detected in registration notifications.'
            : 'Addons present but no specific addon notification detected.'
          : 'No addons selected for this registration.',
      },
      {
        id: 'program-schedule',
        label: 'Program schedule',
        description:
          'Workshop program schedule created for all unlocked programs.',
        status: hasSchedules ? 'done' : 'pending',
        meta: hasSchedules
          ? `${schedulesArr.length} schedule record(s) found.`
          : workshopProgramIds.length
            ? 'No schedules found for current workshop programs.'
            : 'No workshop programs linked to this registration.',
      },
      {
        id: 'attendance',
        label: 'Attendance',
        description: 'Mark the participant as attended / not attended.',
        status: attendanceDone ? 'done' : 'pending',
        meta: attendanceDone
          ? 'Attendance appears to be recorded for this registration.'
          : 'Attendance has not been marked yet.',
      },
      {
        id: 'certification',
        label: 'Certification',
        description: 'Issue and send participation/completion certificate.',
        status: certificationDone ? 'done' : 'pending',
        meta: certificationDone
          ? 'Certificate information exists for this registration.'
          : 'Certificate has not been generated/linked yet.',
      },
    ]

    return steps
  }, [registration, registrationId, schedules, workshopProgramIds.length])

  const firstPendingStep = useMemo(
    () => steps.find((s) => s.status === 'pending') ?? null,
    [steps]
  )

  const openAction = (stepId: string) => {
    setActiveStepId(stepId)
  }

  const closeAction = () => {
    setActiveStepId(null)
  }

  const activeStep = steps.find((s) => s.id === activeStepId) ?? null

  return (
    <div className='rounded-lg border bg-card p-6 shadow-sm'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold'>Registration Workflow</h3>
          <p className='text-sm text-muted-foreground'>
            Track what has been completed for this registration and what still
            needs attention.
          </p>
        </div>
        {schedulesLoading && (
          <span className='text-xs text-muted-foreground'>Checking schedule…</span>
        )}
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-3 py-2'>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isDone = step.status === 'done'
            const isSkipped = step.status === 'skipped'

            const circleBase =
              'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold shadow-sm'

            const circleClass = isDone
              ? 'border-emerald-500 bg-emerald-500 text-emerald-50 dark:border-emerald-400 dark:bg-emerald-500'
              : isSkipped
                ? 'border-muted-foreground/40 text-muted-foreground bg-background dark:bg-muted/40'
                : 'border-sky-500 text-sky-600 bg-sky-50 dark:border-sky-400 dark:text-sky-200 dark:bg-sky-900/40'

            const connectorClass = isDone
              ? 'bg-emerald-500'
              : isSkipped
                ? 'bg-muted-foreground/30'
                : 'bg-sky-300 dark:bg-sky-500/60'

            return (
              <div key={step.id} className='flex items-start gap-3'>
                <div className='flex flex-col items-center gap-1'>
                  <div className={circleBase + ' ' + circleClass}>
                    {isDone ? (
                      <Check className='h-4 w-4' />
                    ) : isSkipped ? (
                      <Minus className='h-4 w-4' />
                    ) : (
                      <Clock className='h-4 w-4' />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`mt-1 h-12 w-[3px] rounded-full ${connectorClass}`}
                    />
                  )}
                </div>

                <div className='flex flex-1 flex-col gap-1 pt-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                      {step.label}
                    </span>

                  </div>
                  <p className='text-[11px] text-muted-foreground'>{step.description}</p>
                  {step.meta && (
                    <p className='text-[10px] font-mono text-muted-foreground/80'>
                      {step.meta}
                    </p>
                  )}
                  <div >
                    {step.status === 'pending' && firstPendingStep?.id === step.id && (
                      <Button
                        className='h-6 rounded-full px-3 text-[10px]'
                        onClick={() => openAction(step.id)}
                      >
                        {step.id === 'registration-notification' && 'Send registration mail'}
                        {step.id === 'addon-notification' && 'Send addon mail'}
                        {step.id === 'program-schedule' && 'Schedule program'}
                        {step.id === 'attendance' && 'Mark attendance'}
                        {step.id === 'certification' && 'Issue certificate'}
                        {step.id === 'registration' &&
                          firstPendingStep.id === 'registration' &&
                          'Create registration'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Dialog open={!!activeStep} onOpenChange={(open) => !open && closeAction()}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{activeStep ? activeStep.label : 'Next action'}</DialogTitle>
              {activeStep && (
                <DialogDescription>{activeStep.description}</DialogDescription>
              )}
            </DialogHeader>
            {activeStep && (
              <div className='space-y-2 text-sm'>
                {activeStep.meta && (
                  <p className='text-xs text-muted-foreground'>{activeStep.meta}</p>
                )}
                <p className='text-xs text-muted-foreground'>
                  This dialog is ready to be wired to the real API / workflow for{' '}
                  <span className='font-semibold'>{activeStep.id}</span>.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant='outline' onClick={closeAction}>
                Close
              </Button>
              <Button onClick={closeAction}>
                {activeStep
                  ? `Confirm ${activeStep.label.toLowerCase()}`
                  : 'Confirm action'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

