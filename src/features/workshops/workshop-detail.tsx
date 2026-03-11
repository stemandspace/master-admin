import { useQuery } from '@tanstack/react-query'
import { Outlet, useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { getWorkshop, getWorkshopRegistrationCount } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { WorkshopRegistrationStatsCard } from './components/workshop-registration-stats-card'

export default function WorkshopDetail() {
  const { workshopId } = useParams({ from: '/_authenticated/workshops/$workshopId' })
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // If we're on a nested registrations route (e.g. /registrations or /registrations/:id),
  // render the child route instead of the workshop detail layout.
  if (pathname.includes('/registrations')) {
    return <Outlet />
  }

  const { data: workshop, isLoading } = useQuery({
    queryKey: ['workshop', workshopId],
    queryFn: async () => await getWorkshop({ id: workshopId }),
  })

  const { data: registrationCount } = useQuery({
    queryKey: ['workshop-registrations-count', workshopId],
    queryFn: async () =>
      await getWorkshopRegistrationCount({ workshopId: String(workshopId) }),
  })

  if (isLoading) {
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
          <div className='flex items-center justify-center py-12'>
            <div>Loading...</div>
          </div>
        </Main>
      </div>
    )
  }

  if (!workshop) {
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
          <div className='flex items-center justify-center py-12'>
            <div>Workshop not found</div>
          </div>
        </Main>
      </div>
    )
  }

  const programs = (workshop as any)?.workshop_programs ?? []
  const totalRegistrations = typeof registrationCount === 'number' ? registrationCount : 0

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
        <div className='mb-4'>
          <Button variant='ghost' onClick={() => navigate({ to: '/workshops' })}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Workshops
          </Button>
        </div>

        <div className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-[minmax(0,2fr)]'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>
                  Workshop Details
                </h2>
                <p>{workshop.title}</p>

              </div>
              <Button
                asChild
                variant='default'
                className='bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              >
                <a href={`/workshops/${String(workshopId)}/registrations`}>
                  View all registrations
                </a>
              </Button>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
            <div className='rounded-lg border bg-blue-50 p-4 shadow-sm dark:bg-blue-950/40 dark:border-blue-900/60'>
              <p className='text-xs font-medium uppercase text-blue-700 dark:text-blue-300'>
                Total registrations
              </p>
              <p className='mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100'>
                {totalRegistrations}
              </p>
            </div>

            <div className='rounded-lg border bg-emerald-50 p-4 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-900/60'>
              <p className='text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300'>
                Total payments
              </p>
              <p className='mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100'>
                ₹ 0
              </p>
            </div>

            <div className='rounded-lg border bg-purple-50 p-4 shadow-sm dark:bg-purple-950/40 dark:border-purple-900/60'>
              <p className='text-xs font-medium uppercase text-purple-700 dark:text-purple-300'>
                New users from workshop
              </p>
              <p className='mt-2 text-2xl font-bold text-purple-900 dark:text-purple-100'>
                0
              </p>
            </div>

            <div className='rounded-lg border bg-amber-50 p-4 shadow-sm dark:bg-amber-950/40 dark:border-amber-900/60'>
              <p className='text-xs font-medium uppercase text-amber-700 dark:text-amber-300'>
                Plans purchased
              </p>
              <p className='mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100'>
                0
              </p>
            </div>

            <div className='rounded-lg border bg-rose-50 p-4 shadow-sm dark:bg-rose-950/40 dark:border-rose-900/60'>
              <p className='text-xs font-medium uppercase text-rose-700 dark:text-rose-300'>
                Comics purchased
              </p>
              <p className='mt-2 text-2xl font-bold text-rose-900 dark:text-rose-100'>
                0
              </p>
            </div>
          </div>

          <WorkshopRegistrationStatsCard workshopId={String(workshopId)} />

          <div className='rounded-lg border bg-card p-6 shadow-sm'>
            <h3 className='mb-4 text-lg font-semibold'>Workshop Programs</h3>
            {Array.isArray(programs) && programs.length ? (
              <div className='space-y-3'>
                {programs.map((p: any) => {
                  const id = p?.id ?? p?.documentId ?? ''
                  const title =
                    p?.title ?? p?.name ?? (id ? `Program ${id}` : 'Untitled program')
                  const desc = p?.desc ?? p?.description ?? ''
                  const grade = p?.grade ?? ''
                  const price = p?.price ?? ''
                  const createdAt = p?.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : null
                  const updatedAt = p?.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString()
                    : null

                  const gradeBadges = String(grade)
                    .split(',')
                    .map((g: string) => g.trim())
                    .filter(Boolean)

                  return (
                    <div
                      key={String(id || Math.random())}
                      className='flex flex-col gap-3 rounded-md border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between'
                    >
                      <div className='space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-sm font-semibold'>{title}</p>
                          {id && (
                            <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground'>
                              ID: {id}
                            </span>
                          )}
                        </div>
                        {desc && (
                          <p className='text-xs text-muted-foreground'>{desc}</p>
                        )}
                        <div className='mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground'>
                          {gradeBadges.length > 0 && (
                            <div className='flex flex-wrap items-center gap-1'>
                              <span className='font-medium'>Grades:</span>
                              {gradeBadges.map((g: string) => (
                                <span
                                  key={g}
                                  className='rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-100'
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                          {price && (
                            <span className='ml-0 flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300'>
                              <span className='text-xs uppercase text-muted-foreground'>
                                Price:
                              </span>
                              <span>₹ {price}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-col items-start gap-1 text-[11px] text-muted-foreground md:items-end'>
                        {createdAt && (
                          <span>
                            Created:{' '}
                            <span className='font-mono text-xs'>{createdAt}</span>
                          </span>
                        )}
                        {updatedAt && (
                          <span>
                            Updated:{' '}
                            <span className='font-mono text-xs'>{updatedAt}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

              </div>
            ) : (
              <p className='text-muted-foreground'>No programs.</p>
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}

