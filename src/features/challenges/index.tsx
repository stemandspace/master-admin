import { useQuery } from '@tanstack/react-query'
import { getChallengeRequest } from '@/utils/fetcher-functions'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/challenge-columns'
import { UsersTable } from './components/challenge-table'
import { useState } from 'react'

// import { UsersDialogs } from './components/users-dialogs'

// import UsersProvider from './context/users-context'
// import { userListSchema } from './data/schema'
// import { users } from './data/users'

export default function Challenge() {
  const [challenge, setChallenge] = useState({ id: '', title: '' })
  const id = challenge.id
  console.log(challenge, "id",id)
  const {
    data: challenges,
    isLoading,
  } = useQuery({
    queryKey: ['challenge-activities',id],
    queryFn: async () => await getChallengeRequest({ id }),
    enabled: !!id, 
  })

  const handleChallengeSelect = ({
    id,
    title,
  }: {
    id: string
    title: string
  }) => {
    setChallenge({ id, title })
    console.log(id, title)
  }

  console.log(challenges)
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
            <h2 className='text-2xl font-bold tracking-tight'>Challenges</h2>
            <p className='text-muted-foreground'>List of all challenges</p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          {/* {JSON.stringify(questions)} */}
          <UsersTable
            data={challenges||[]}
            columns={columns}
            handleChallengeSelect={handleChallengeSelect}
          />
        </div>
      </Main>
    </div>
  )
}
