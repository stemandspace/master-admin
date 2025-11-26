import { useQuery } from '@tanstack/react-query'
import { getLiveEvents } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/live-event-columns'
import { LiveEventDialogs } from './components/live-event-dialogs'
import { LiveEventPrimaryButtons } from './components/live-event-primary-buttons'
import { LiveEventTable } from './components/live-event-table'
import LiveEventsProvider from './context/live-events-context'

export default function LiveEvents() {
  const { data: liveEvents, isLoading } = useQuery({
    queryKey: ['live-events'],
    queryFn: async () => await getLiveEvents(),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <LiveEventsProvider>
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
              <h2 className='text-2xl font-bold tracking-tight'>Live Events</h2>
              <p className='text-muted-foreground'>
                Manage live events and their participants
              </p>
            </div>
            <LiveEventPrimaryButtons />
          </div>
          <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
            <LiveEventTable data={liveEvents || []} columns={columns} />
          </div>
        </Main>
        <LiveEventDialogs />
      </div>
    </LiveEventsProvider>
  )
}
