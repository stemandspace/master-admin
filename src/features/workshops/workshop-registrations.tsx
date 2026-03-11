import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useParams, useSearch, useRouter, useRouterState } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useDebouncedValue } from '@mantine/hooks'
import { getWorkshop, getWorkshopRegistrations } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function WorkshopRegistrations() {
  const { workshopId } = useParams({
    from: '/_authenticated/workshops/$workshopId/registrations',
  })
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // When on nested detail route (/registrations/:registrationId), render child instead of list.
  if (pathname.includes('/registrations/')) {
    return <Outlet />
  }

  const search: {
    email?: string
    page?: number
  } = useSearch({
    from: '/_authenticated/workshops/$workshopId/registrations',
  })
  const router = useRouter()

  const page = search.page && Number(search.page) > 0 ? Number(search.page) : 1
  const pageSize = 25
  const email = search.email ?? ''
  const [debouncedEmail] = useDebouncedValue(email, 400)

  const { data: workshop } = useQuery({
    queryKey: ['workshop', workshopId],
    queryFn: async () => await getWorkshop({ id: String(workshopId) }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['workshop-registrations', workshopId, debouncedEmail, page, pageSize],
    queryFn: async () =>
      await getWorkshopRegistrations({
        workshopId: String(workshopId),
        email: debouncedEmail,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
  })

  const rows = Array.isArray(data?.data) ? data.data : []
  const pagination = data?.meta?.pagination
  const pageCount = pagination?.pageCount ?? 1
  const total = pagination?.total ?? rows.length
  const canPrev = page > 1
  const canNext = page < pageCount

  const getRegistrantName = (r: any) => {
    return (
      r?.name ??
      r?.fullName ??
      (r?.user
        ? `${r.user?.firstname ?? ''} ${r.user?.lastname ?? ''}`.trim() ||
        r.user?.username
        : undefined) ??
      r?.attributes?.name ??
      '—'
    )
  }

  const getRegistrantEmail = (r: any) => {
    return r?.email ?? r?.user?.email ?? r?.attributes?.email ?? '—'
  }

  const getWorkshopId = (r: any) => {
    // Common Strapi shapes: r.workshop, r.workshop.data.attributes, etc.
    const w = r?.workshop
    return (
      w?.id ?? '—'
    )
  }

  const getWorkshopProgramId = (r: any) => {
    const w = r?.workshop_programs.map((p: any) => p.id).join(', ')
    return (
      w ?? '—'
    )
  }

  const getGrade = (r: any) => {
    return r?.grade ?? '—'
  }

  const getAddons = (r: any) => {
    return r?.addons?.map((a: any) => a?.name).join(', ') ?? '—'
  }

  const getTotalAmountPaid = (r: any) => {
    if (!Array.isArray(r?.workshop_payments) || r.workshop_payments.length === 0) {
      return '—'
    }
    const sum = r.workshop_payments.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0)
    return sum > 0 ? `₹ ${Math.round(sum / 100)}` : '—'
  }

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
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <Button asChild variant='ghost'>
            <Link to='/workshops/$workshopId' params={{ workshopId: String(workshopId) }}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Workshop
            </Link>
          </Button>

          <div className='flex flex-wrap items-center gap-2'>
            <div className='text-sm text-muted-foreground'>
              Page {page} of {pageCount} · Total {total}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    page: Math.max(1, page - 1),
                  }),
                  replace: true,
                })
              }
              disabled={!canPrev}
            >
              Prev
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    page: page + 1,
                  }),
                  replace: true,
                })
              }
              disabled={!canNext}
            >
              Next
            </Button>
          </div>
        </div>

        <div className='mb-2 space-y-1'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Workshop Registrations
          </h2>
          <p className='text-sm text-muted-foreground'>
            {workshop
              ? (workshop as any).title ?? (workshop as any).name ?? ''
              : ''}
          </p>
        </div>

        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <div className='w-full max-w-sm'>
            <Input
              value={email}
              onChange={(e) => {
                const value = e.target.value
                router.navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    email: value || undefined,
                    page: 1,
                  }),
                  replace: true,
                })
              }}
              placeholder='Search by email...'
            />
          </div>
          {email.trim() ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                router.navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    email: undefined,
                    page: 1,
                  }),
                  replace: true,
                })
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[120px]'>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Workshop Programs</TableHead>
                  <TableHead>Addons</TableHead>
                  <TableHead>Total Amount Paid</TableHead>
                  <TableHead className='w-[120px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((r: any) => (
                    <TableRow
                      style={{
                        backgroundColor: r?.email.includes('@spacetopia.in') ? 'lightcyan' : 'transparent',
                      }}
                      key={String(r?.id ?? Math.random())}>
                      <TableCell className='font-mono text-xs'>
                        {String(r?.id ?? '—')}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getRegistrantName(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getRegistrantEmail(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getGrade(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getWorkshopId(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getWorkshopProgramId(r)}
                      </TableCell>
                      <TableCell className='text-nowrap uppercase'>
                        {getAddons(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        {getTotalAmountPaid(r)}
                      </TableCell>
                      <TableCell className='text-nowrap'>
                        <Button
                          asChild
                          variant='outline'
                          size='sm'
                        >
                          <Link
                            to='/workshops/$workshopId/registrations/$registrationId'
                            params={{
                              workshopId: String(workshopId),
                              registrationId: String(r?.id),
                            }}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      No registrations found.
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

