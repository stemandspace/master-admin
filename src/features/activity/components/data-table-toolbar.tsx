import { useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Table } from '@tanstack/react-table'
import { getCourses } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { userTypes } from '../data/data'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const search: {
    course?: string
  } = useSearch({ from: '/_authenticated/activity-request/' })

  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string
    title: string
  }>({ id: search?.course || '', title: '' })

  // Fetch courses
  const {
    data: courses,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const handleCourseChange = (newCourse: any) => {
    setSelectedCourse({ id: newCourse?.id, title: newCourse?.title })

    router.navigate({
      to: '.',
      search: (prev) => ({ ...prev, course: newCourse || undefined }),
      replace: true,
    })
  }
  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {/* Course Select Dropdown */}
        <Select
          onValueChange={(value) => {
            const selectedChallenge = courses.find(
              (course: any) => course.id === value
            )
            if (selectedChallenge) {
              handleCourseChange(selectedChallenge.id)
              setSelectedCourse(selectedChallenge)
            }
          }}
          value={selectedCourse?.id}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select course' />
          </SelectTrigger>
          <SelectContent>
            {courses?.map((option: { id: string; title: string }) => (
              <SelectItem key={option.id} value={option.id}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters */}
        <div className='flex gap-x-2'>
          {table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title='Status'
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
          )}
          {table.getColumn('role') && (
            <DataTableFacetedFilter
              column={table.getColumn('role')}
              title='Role'
              options={userTypes.map((t) => ({ ...t }))}
            />
          )}
        </div>

        {/* Reset Filters Button */}
        {table.getState().columnFilters.length > 0 && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
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
