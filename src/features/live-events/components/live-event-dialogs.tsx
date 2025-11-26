import { useLiveEvents } from '../context/live-events-context'
import { LiveEventActionDialog } from './live-event-action-dialog'
import { LiveEventDeleteDialog } from './live-event-delete-dialog'

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
