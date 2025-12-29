import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Submission } from '../data/schema'
import { SubmissionActionDialog } from './submission-action-dialog'
import { DataTableColumnHeader } from './data-table-column-header'
import { useNavigate } from '@tanstack/react-router'

function ActionsCell({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className='flex w-fit gap-2 text-nowrap'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          navigate({
            to: '/submissions/$submissionId',
            params: { submissionId: submission.id },
          })
        }}
      >
        View
      </Button>
      <Button onClick={() => setOpen(true)}>Details</Button>
      <SubmissionActionDialog
        data={submission}
        key={`submission-${submission.id}`}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}

export const columns: ColumnDef<Submission>[] = [
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
    id: 'label',
    header: () => <p>Label</p>,
    cell: ({ row }) => <p>{row?.original?.label || 'N/A'}</p>,
    enableSorting: false,
  },
  {
    id: 'content_type',
    accessorKey: 'content_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Content Type' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap capitalize'>
        {row.original?.content_type || 'N/A'}
      </div>
    ),
  },
  {
    id: 'content_id',
    header: () => <p>Content ID</p>,
    cell: ({ row }) => <p>{row?.original?.content_id || 'N/A'}</p>,
    enableSorting: false,
  },
  {
    id: 'email',
    header: () => <p>Email</p>,
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => <p>{row?.original?.user?.email || 'N/A'}</p>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'media',
    header: () => <p>Media</p>,
    cell: ({ row }) => {
      const media = row.original?.media
      if (!media || media.length === 0) {
        return <p className='text-muted-foreground'>No media</p>
      }

      const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
      const isPDF = (url: string) => /\.pdf$/i.test(url)
      const isAudio = (url: string) => /\.(mp3|wav|ogg|m4a)$/i.test(url)

      return (
        <div className='flex gap-2 flex-wrap'>
          {media.slice(0, 3).map((mediaItem, index) => {
            const mediaUrl = mediaItem.url
            if (isVideo(mediaUrl)) {
              return (
                <div
                  key={mediaItem.id || index}
                  className='h-12 w-12 rounded border bg-muted flex items-center justify-center text-xs'
                  title='Video'
                >
                  🎥
                </div>
              )
            } else if (isPDF(mediaUrl)) {
              return (
                <div
                  key={mediaItem.id || index}
                  className='h-12 w-12 rounded border bg-muted flex items-center justify-center text-xs'
                  title='PDF'
                >
                  📄
                </div>
              )
            } else if (isAudio(mediaUrl)) {
              return (
                <div
                  key={mediaItem.id || index}
                  className='h-12 w-12 rounded border bg-muted flex items-center justify-center text-xs'
                  title='Audio'
                >
                  🎵
                </div>
              )
            } else {
              return (
                <img
                  key={mediaItem.id || index}
                  src={mediaUrl}
                  alt={`Media ${index + 1}`}
                  className='h-12 w-12 rounded border object-cover cursor-pointer hover:opacity-80'
                  onClick={() => window.open(mediaUrl, '_blank')}
                  title='Click to view full size'
                />
              )
            }
          })}
          {media.length > 3 && (
            <div className='h-12 w-12 rounded border bg-muted flex items-center justify-center text-xs font-semibold'>
              +{media.length - 3}
            </div>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap capitalize'>
        {row.original?.status || 'N/A'}
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
        {new Date(row.original.createdAt).toLocaleDateString() || 'N/A'}
      </div>
    ),
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actions' />
    ),
    cell: ({ row }) => <ActionsCell submission={row.original} />,
  },
]

