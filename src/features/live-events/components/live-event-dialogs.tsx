import { useLiveEvents } from '../context/live-events-context'
import { LiveEventActionDialog } from './live-event-action-dialog'
import { LiveEventDeleteDialog } from './live-event-delete-dialog'
import { RewardNotificationDialog } from './reward-notification-dialog'
import { SelectWinnersDialog } from './select-winners-dialog'
import { SendParticipantsEmailDialog } from './send-participants-email-dialog'

export function LiveEventDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useLiveEvents()
  return (
    <>
      <LiveEventActionDialog
        key='live-event-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <LiveEventActionDialog
            key={`live-event-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <SelectWinnersDialog
            key={`live-event-select-winners-${currentRow.id}`}
            open={open === 'select-winners'}
            onOpenChange={() => {
              setOpen('select-winners')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <RewardNotificationDialog
            key={`live-event-reward-notification-${currentRow.id}`}
            open={open === 'reward-notification'}
            onOpenChange={() => {
              setOpen('reward-notification')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <SendParticipantsEmailDialog
            key={`live-event-send-participants-email-${currentRow.id}`}
            open={open === 'send-participants-email'}
            onOpenChange={() => {
              setOpen('send-participants-email')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <LiveEventDeleteDialog
            key={`live-event-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
