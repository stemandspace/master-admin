import { useState, useEffect } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const search: {
    content_type?: string
    content_id?: string
  } = useSearch({ from: '/_authenticated/submissions/' })

  const router = useRouter()
  const [contentId, setContentId] = useState<string>(search?.content_id || '')

  // Update local state when search params change
  useEffect(() => {
    setContentId(search?.content_id || '')
  }, [search?.content_id])

  const handleContentIdChange = (value: string) => {
    setContentId(value)
    router.navigate({
      to: '.',
      search: (prev) => ({ ...prev, content_id: value || undefined }),
      replace: true,
    })
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {/* Content ID Input */}
        <Input
          placeholder='Filter by content ID...'
          value={contentId}
          onChange={(e) => handleContentIdChange(e.target.value)}
          className='h-8 w-[200px]'
        />

        {/* Status Filter */}
        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title='Status'
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Selected', value: 'selected' },
              { label: 'Rejected', value: 'rejected' },
            ]}
          />
        )}

        {/* Content Type Filter */}
        {table.getColumn('content_type') && (
          <DataTableFacetedFilter
            column={table.getColumn('content_type')}
            title='Content Type'
            options={[
              { label: 'DIY', value: 'diy' },
              { label: 'Course', value: 'course' },
              { label: 'ANA', value: 'ana' },
            ]}
          />
        )}

        {/* Reset Filters Button */}
        {(table.getState().columnFilters.length > 0 || contentId) && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              setContentId('')
              router.navigate({
                to: '.',
                search: {},
                replace: true,
              })
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      {/* View Options */}
      <DataTableViewOptions table={table} />
    </div>
  )
}
