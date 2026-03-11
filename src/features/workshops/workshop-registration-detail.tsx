import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { getWorkshopRegistration } from '@/utils/fetcher-functions'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { WorkshopRegistrationWorkflow } from './components/workshop-registration-workflow'

interface DetailRow {
  label: string
  value: string | number | null | undefined
}

interface DetailsCardProps {
  title: string
  rows: DetailRow[]
}

function DetailsCard({ title, rows }: DetailsCardProps) {
  return (
    <div className='rounded-lg border bg-card p-6 shadow-sm'>
      <h3 className='mb-4 text-lg font-semibold'>{title}</h3>
      <div className='w-full overflow-hidden rounded-lg border'>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border-b last:border-b-0`}
          >
            <div className='border-r bg-muted px-4 py-2 text-sm font-medium text-muted-foreground'>
              {row.label}
            </div>
            <div className='px-4 py-2 text-sm'>
              {row.value !== undefined && row.value !== null && row.value !== ''
                ? String(row.value)
                : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WorkshopRegistrationDetail() {
  const { workshopId, registrationId } = useParams({
    from: '/_authenticated/workshops/$workshopId/registrations/$registrationId',
  })
  const navigate = useNavigate()

  const { data: registration, isLoading } = useQuery({
    queryKey: ['workshop-registration', registrationId],
    queryFn: async () => await getWorkshopRegistration({ id: String(registrationId) }),
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

  if (!registration) {
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
            <div>Registration not found</div>
          </div>
        </Main>
      </div>
    )
  }

  const reg: any = registration
  const workshopTitle =
    reg.workshop?.title ??
    reg.workshop?.name ??
    reg.workshop?.attributes?.title ??
    reg.workshop?.attributes?.name ??
    '—'
  const unlockedPrograms =
    Array.isArray(reg.workshop_programs) && reg.workshop_programs.length
      ? reg.workshop_programs
      : []

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
          <Button
            variant='ghost'
            onClick={() =>
              navigate({
                to: '/workshops/$workshopId/registrations',
                params: { workshopId: String(workshopId) },
              })
            }
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Registrations
          </Button>
        </div>

        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Registration Details
              </h2>
              <p className='text-muted-foreground'>
                Registration ID: {reg.id} · Workshop ID: {workshopId}
              </p>
            </div>
          </div>

          <WorkshopRegistrationWorkflow registration={reg} />

          <div className='grid gap-4 md:grid-cols-2'>
            <DetailsCard
              title='Registrant'
              rows={[
                { label: 'Name', value: reg.name },
                { label: 'Email', value: reg.email },
                { label: 'Grade', value: reg.grade },
                { label: 'Phone', value: reg.phone },
                { label: 'School', value: reg.school_name },


              ]}
            />

            <DetailsCard
              title='Workshop Unlocked'
              rows={[
                { label: 'Workshop ID', value: reg.workshop?.id },
                { label: 'Workshop Title', value: workshopTitle },
                {
                  label: 'Programs Unlocked',
                  value: unlockedPrograms.length
                    ? unlockedPrograms
                      .map(
                        (p: any) =>
                          (p?.title ?? p?.name ?? `Program ${p?.id ?? ''}`)
                      )
                      .join(', ')
                    : '—',
                },
                {
                  label: 'Addons',
                  value:
                    Array.isArray(reg.addons) && reg.addons.length
                      ? reg.addons.map((a: any) => a?.name).join(', ')
                      : '—',
                },
              ]}
            />
          </div>

          <div className='rounded-lg border bg-card p-6 shadow-sm'>
            <h3 className='mb-2 text-lg font-semibold'>Raw Data</h3>
            <pre className='max-h-[400px] overflow-auto rounded bg-muted p-3 text-xs'>
              {JSON.stringify(reg, null, 2)}
            </pre>
          </div>
        </div>
      </Main>
    </div>
  )
}

