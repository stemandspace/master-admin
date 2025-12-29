import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { getSubmissions } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/submission-columns'
import { SubmissionTable } from './components/submission-table'

export default function Submissions() {
  const search: {
    content_type?: string
    content_id?: string
  } = useSearch({ from: '/_authenticated/submissions/' })

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', search.content_type, search.content_id],
    queryFn: async () =>
      await getSubmissions({
        content_type: search.content_type,
        content_id: search.content_id,
      }),
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
            <h2 className='text-2xl font-bold tracking-tight'>
              Activity Requests
            </h2>
            <p className='text-muted-foreground'>
              Manage and review user submissions
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <SubmissionTable data={submissions || []} columns={columns} />
        </div>
      </Main>
    </div>
  )
}

