import { useState, useEffect } from 'react'
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

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  handleChallengeSelect: (arg0: { id: string; title: string }) => void
}

export function DataTableToolbar<TData>({
  table,
  handleChallengeSelect
}: DataTableToolbarProps<TData>) {
  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => await getChallenges(),
  })

  // Set default challenge to the first item if available
  const [challenge, setChallenge] = useState({ id: '', title: '' })

  useEffect(() => {
    if (challenges?.length > 0) {
      const defaultChallenge = { id: challenges[0].id, title: challenges[0].title }
      setChallenge(defaultChallenge)
      handleChallengeSelect(defaultChallenge) // Ensure Users component updates
    }
  }, [challenges])
  

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Select
          onValueChange={(value) => {
            const selectedChallenge = challenges.find(
              (challenge:any) => challenge.id === value
            )
            if (selectedChallenge) {
              handleChallengeSelect(selectedChallenge)
              setChallenge(selectedChallenge)
            }
          }}
          value={challenge?.id}
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
