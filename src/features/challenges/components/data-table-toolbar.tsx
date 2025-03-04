import { useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { Table } from '@tanstack/react-table'
import { getChallenges } from '@/utils/fetcher-functions'
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
import { useRouter, useSearch } from '@tanstack/react-router'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {


    const search: {
      challenge?: string
    } = useSearch({ from: '/_authenticated/challenges/' })
  
    const router = useRouter()
    const [selectedChallenge, setSelectedChallenge] = useState<{
      id: string
      title: string
    }>({ id: search?.challenge || '', title: '' })
  

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => await getChallenges(),
  })


  const handleChallengeChange = (newCourse: any) => {
    setSelectedChallenge({ id: newCourse?.id, title: newCourse?.title })

    router.navigate({
      to: '.',
      search: (prev) => ({ ...prev, challenge: newCourse.id || undefined }),
      replace: true,
    })
  }
  

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Select
          onValueChange={(value) => {
            const selectedChallenge = challenges.find(
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
            {challenges?.map((option: { id: string; title: string }) => (
              <SelectItem key={option.id} value={option.id}>
                {option.title}
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
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejectd', value: 'rejected' },
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
      <DataTableViewOptions table={table} />
    </div>
  )
}
