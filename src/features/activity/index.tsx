import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { getActivityRequest, getActivityRequestForDiy } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/activity-columns'
import { ActivityTable } from './components/activity-table'

type ActivityContentType = 'course' | 'diy'

export default function Activity() {
  const search: {
    course?: string
    content_type?: ActivityContentType
    content_id?: string
  } = useSearch({ from: '/_authenticated/activity-request/' })

  const contentType: ActivityContentType = search.content_type || 'course'
  const id = search.content_id || search.course || ''

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['activity', contentType, id],
    queryFn: async () => {
      if (!id) return []

      if (contentType === 'diy') {
        return await getActivityRequestForDiy({id})
      }

      return await getActivityRequest({ id })
    },
  })
  if (isLoading) return <div>Loading...</div>

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
            <h2 className='text-2xl font-bold tracking-tight'>Activity</h2>
            <p className='text-muted-foreground'>
              Activity requested by the user
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <ActivityTable data={challenges || []} columns={columns} />
        </div>
      </Main>
    </div>
  )
}
