import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LiveEvent } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<LiveEvent>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.original.title || 'N/A'}</div>
    ),
  },
  {
    accessorKey: 'winners_rewarded',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Winners Rewarded' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {row.original.winners_rewarded ? 'Yes' : 'No'}
      </div>
    ),
  },
  {
    accessorKey: 'participations_rewarded',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Participations Rewarded' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {row.original.participations_rewarded ? 'Yes' : 'No'}
      </div>
    ),
  },
  {
    accessorKey: 'winners',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Winners Count' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {row.original.winners?.length || 0}
      </div>
    ),
  },
  {
    accessorKey: 'participants',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Participants Count' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {row.original.participants?.length || 0}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : 'N/A'}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
