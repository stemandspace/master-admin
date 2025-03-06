import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
// import { time } from 'console'
import { cn } from '@/lib/utils'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import { useUsers } from '../context/users-context'
// import { callTypes, userTypes } from '../data/data'
import { Answering } from '../data/schema'
import { ChallengeActionDialog } from './challenge-action-dialog'
import { DataTableColumnHeader } from './data-table-column-header'

// import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Answering>[] = [
  {
    id: 'id',
    header: () => <p>Id</p>,
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => <p>{row?.original?.id}</p>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'media',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Media' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap uppercase'>
        {/* @ts-ignore */}
        {row?.original?.media ? 'A' : 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'user',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='User' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap lowercase'>
        {/* @ts-ignore */}
        {row.original?.user?.email || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='  Status' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap uppercase'>
        {/* @ts-ignore */}
        {row.original?.status || 'N/A'}
      </div>
    ),
  },
  {
    id: 'winner',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Winner' />
    ),
    cell: ({ row }) => {
      return (
        <div className='w-fit text-nowrap uppercase'>
          {row.original?.winner ? 'TRUE' : 'FALSE'}
        </div>
      )
    },
    meta: { className: 'w-52' },
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
          <ChallengeActionDialog
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
