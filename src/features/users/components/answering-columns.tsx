import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { time } from 'console'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import CheckMark from '@/components/check-mark'
import LongText from '@/components/long-text'
import { useUsers } from '../context/users-context'
import { callTypes, userTypes } from '../data/data'
import { Answering, User } from '../data/schema'
import { AnsweringActionDialog } from './answering-action-dialog'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Answering>[] = [
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
    cell: ({ row }) => <CheckMark id={parseInt(row.original.id)} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'question',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Question' />
    ),
    cell: ({ row }) => {
      const { question } = row.original
      return <LongText className='max-w-xl'>{question || 'N/A'}</LongText>
    },
    meta: { className: 'w-52' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {/* @ts-ignore */}
        {row.original?.user?.email || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='CreatedAt' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>
        {/* @ts-ignore */}
        {new Date(row.original.createdAt).toDateString({
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) || 'N/A'}
      </div>
    ),
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' />
    ),
    cell: ({ row }) => {
      const [open, setOpen] = useState(false)

      return (
        <div className='w-fit text-nowrap'>
          <Button onClick={() => setOpen(true)}>View</Button>
          <AnsweringActionDialog
            //@ts-ignore
            data={row.original}
            key='question-view'
            open={open}
            onOpenChange={setOpen}
          />
        </div>
      )
    },
  },
]
