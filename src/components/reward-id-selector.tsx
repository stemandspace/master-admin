'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRewardById } from '@/utils/fetcher-functions'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RewardIdSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RewardIdSelector({
  selected,
  onChange,
  placeholder = 'Enter reward ID',
  className,
  disabled,
}: RewardIdSelectorProps) {
  const [rewardIdInput, setRewardIdInput] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSearch = async () => {
    const id = rewardIdInput.trim()
    if (!id) {
      toast({
        title: 'Error',
        description: 'Please enter a reward ID',
        variant: 'destructive',
      })
      return
    }

    if (selected.includes(id)) {
      toast({
        title: 'Error',
        description: 'This reward is already selected',
        variant: 'destructive',
      })
      setRewardIdInput('')
      return
    }

    setIsSearching(true)
    try {
      const reward = await getRewardById({ id })
      if (reward) {
        onChange([...selected, id])
        setRewardIdInput('')
        toast({
          title: 'Success',
          description: `Reward #${id} added successfully`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Reward with ID ${id} not found`,
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleRemove = (id: string) => {
    onChange(selected.filter((s) => s !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex gap-2'>
        <Input
          type='text'
          placeholder={placeholder}
          value={rewardIdInput}
          onChange={(e) => setRewardIdInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSearching}
          className='flex-1'
        />
        <Button
          type='button'
          onClick={handleSearch}
          disabled={disabled || isSearching || !rewardIdInput.trim()}
          size='default'
        >
          <Search className='h-4 w-4' />
        </Button>
      </div>
      {selected.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {selected.map((id) => (
            <Badge
              key={id}
              variant='secondary'
              className='flex items-center gap-1 px-2 py-1'
            >
              <span>Reward #{id}</span>
              <button
                type='button'
                onClick={() => handleRemove(id)}
                className='ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
                disabled={disabled}
              >
                <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
