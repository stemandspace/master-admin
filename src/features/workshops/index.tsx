import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWorkshops } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Link } from '@tanstack/react-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Workshop = {
  id: string | number
  title?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

export default function Workshops() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['workshops', page, pageSize],
    queryFn: async () => await getWorkshops({ page, pageSize }),
    placeholderData: (prev) => prev,
  })

  if (isLoading) return <div>Loading...</div>

  const rows: Workshop[] = Array.isArray(data?.data) ? data.data : []
  const pagination = data?.meta?.pagination

  const pageCount = pagination?.pageCount ?? 1
  const total = pagination?.total ?? rows.length
  const canPrev = page > 1
  const canNext = page < pageCount

  const pageSizeOptions = [10, 20, 50, 100]

  return (
    <div>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Workshops</h2>
            <p className='text-muted-foreground'>List of all workshops</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='text-sm text-muted-foreground'>
              Page {page} of {pageCount} · Total {total}
            </div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Page size' />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              Prev
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              Next
            </Button>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          {rows.length === 0 ? (
            <div className='mb-3'>
              <Alert>
                <AlertTitle>No workshops returned</AlertTitle>
                <AlertDescription>
                  If you expected data here, verify your Strapi collection type
                  is named <span className='font-mono'>workshops</span> and the
                  API token has permission to read it.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[120px]'>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className='w-[160px]'>Created</TableHead>
                  <TableHead className='w-[160px]'>Updated</TableHead>
                  <TableHead className='w-[140px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((w) => (
                    <TableRow key={String(w.id)}>
                      <TableCell className='font-mono text-xs'>
                        {String(w.id)}
                      </TableCell>
                      <TableCell>{w.title || '—'}</TableCell>
                      <TableCell>
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {w.updatedAt
                          ? new Date(w.updatedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant='outline' size='sm'>
                          <Link
                            to='/workshops/$workshopId'
                            params={{ workshopId: String(w.id) }}
                          >
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center'>
                      No workshops found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Main>
    </div>
  )
}

