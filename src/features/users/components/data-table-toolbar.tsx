import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { userTypes } from '../data/data'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {  getThemes } from '@/utils/fetcher-functions'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0



 
  const search: {
    theme?: string
  } = useSearch({ from: '/_authenticated/users/' })

  const router = useRouter()
  const [selectedChallenge, setSelectedChallenge] = useState<{
    id: string
    title: string
  }>({ id: search?.theme || '', title: '' })


const { data: themes } = useQuery({
  queryKey: ['disconvery-jar-config'],
  queryFn: async () => await getThemes(),
})


const handleChallengeChange = (newCourse: any) => {
  setSelectedChallenge({ id: newCourse?.id, title: newCourse?.title })

  router.navigate({
    to: '.',
    search: (prev) => ({ ...prev, theme: newCourse.id || undefined }),
    replace: true,
  })
}




  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
      <Select
          onValueChange={(value) => {
            const selectedChallenge = themes.find(
              (challenge:any) => challenge.id === value
            )
            if (selectedChallenge) {
              handleChallengeChange(selectedChallenge)
              setSelectedChallenge(selectedChallenge)
            }
          }}
          value={selectedChallenge?.id}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select challenge' />
          </SelectTrigger>
          <SelectContent>
            {themes?.map((option: { id: string; theme_name: string }) => (
              <SelectItem key={option.id} value={option.id}>
                {option.theme_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='flex gap-x-2'>
          {table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title='Status'
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Invited', value: 'invited' },
                { label: 'Suspended', value: 'suspended' },
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
        {isFiltered && (
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
      <DataTableViewOptions table={table} />
    </div>
  )
}
