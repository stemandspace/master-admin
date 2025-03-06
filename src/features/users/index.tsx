import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { getDjQuestions } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/answering-columns'
import { UsersPrimaryButtons } from './components/answering-primary-buttons'
import { UsersTable } from './components/answering-table'

// import { UsersDialogs } from './components/users-dialogs'

// import UsersProvider from './context/users-context'
// import { userListSchema } from './data/schema'
// import { users } from './data/users'
 
export default function Users() {
  const search: {
    theme?: string
  } = useSearch({ from: '/_authenticated/users/' })

  const id = search?.theme || ""

  const {
    data: questions,
    isLoading,
    // isError,
    // error,
 
  } = useQuery({
    queryKey: ['discovery_jar_quetions', id],
    queryFn: async () => await getDjQuestions({ id }),
    
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
            <h2 className='text-2xl font-bold tracking-tight'>Questions</h2>
            <p className='text-muted-foreground'>
              These are the questions asked via Discovery Jar
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          {/* {JSON.stringify(questions)} */}
          <UsersTable data={questions || []} columns={columns} />
        </div>
      </Main>
    </div>
  )
}
