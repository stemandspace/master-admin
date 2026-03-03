import { useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Table } from '@tanstack/react-table'
import { getCourses, getDiys } from '@/utils/fetcher-functions'
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

type ActivityType = "course" | "diy"

const activityTypes = ["course", "diy"]

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const search: {
    course?: string
    content_type?: ActivityType
    content_id?: string
  } = useSearch({ from: '/_authenticated/activity-request/' })

  const router = useRouter()

  const [selectedActivityContentType, setActivityContentType] =
    useState<ActivityType>(search?.content_type || 'course')

  const [selectedCourse, setSelectedCourse] = useState<{
    id: string
    title: string
  }>({
    id: search?.content_id || search?.course || '',
    title: '',
  })

  // Fetch courses
  const {
    data: courses,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  // Fetch DIYs (Lives)
  const {
    data: diys,
    isLoading: isLoadingDiys,
  } = useQuery({
    queryKey: ['lives'],
    queryFn: getDiys,
  })

  const handleContentChange = (id: string, title: string) => {
    setSelectedCourse({ id, title })

    router.navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        course: selectedActivityContentType === 'course' ? id : undefined,
        content_type: selectedActivityContentType,
        content_id: id || undefined,
      }),
      replace: true,
    })
  }

  if (isLoading || isLoadingDiys) {
    return <div>Loading...</div>
  }

  return (
    <div className='flex items-center justify-between'>
{/* {JSON.stringify(diys)} */}
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>

        {/* Activity Type Dropdown */}
        <Select
          onValueChange={(value: ActivityType) => {
            setActivityContentType(value)
            setSelectedCourse({ id: '', title: '' })
            router.navigate({
              to: '.',
              search: (prev: {
                course?: string
                content_type?: ActivityType
                content_id?: string
              }) => ({
                ...prev,
                content_type: value,
                content_id: undefined,
                course: value === 'course' ? prev.course : undefined,
              }),
              replace: true,
            })
          }}
          value={selectedActivityContentType}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select activity type' />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Course Select Dropdown */}

        <Select
          onValueChange={(value) => {
            const activityItems =
              selectedActivityContentType === 'course'
                ? courses || []
                : diys || []

            const selectedItem = activityItems.find(
              (item: any) => item.id?.toString() === value
            )

            if (selectedItem) {
              handleContentChange(
                selectedItem.id?.toString() || '',
                selectedItem.title || selectedItem.name || ''
              )
            }
          }}
          value={selectedCourse?.id}
        >
          <SelectTrigger className='w-full'>
            <SelectValue
              placeholder={
                selectedActivityContentType === 'course'
                  ? 'Select course'
                  : 'Select DIY'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(selectedActivityContentType === 'course'
              ? courses || []
              : diys || []
            )?.map((option: any) => (
              <SelectItem
                key={option.id}
                value={option.id?.toString() || ''}
              >
                {option.title || option.name || `Item #${option.id}`}
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
