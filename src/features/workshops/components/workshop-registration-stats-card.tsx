import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { getWorkshopRegistrations } from '@/utils/fetcher-functions'

interface WorkshopRegistrationStatsCardProps {
  workshopId: string
}

type DayBucket = {
  name: string
  dateKey: string
  count: number
}

export function WorkshopRegistrationStatsCard({
  workshopId,
}: WorkshopRegistrationStatsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['workshop-registrations-last7', workshopId],
    queryFn: async () => {
      // Fetch up to 500 registrations for this workshop; we'll filter last 7 days client-side.
      const res = await getWorkshopRegistrations({
        workshopId,
        page: 1,
        pageSize: 500,
      })
      return Array.isArray(res?.data) ? res.data : []
    },
  })

  const { buckets, total } = useMemo(() => {
    const now = new Date()
    const days: DayBucket[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateKey = d.toISOString().slice(0, 10)
      const name = d.toLocaleDateString(undefined, {
        weekday: 'short',
      })
      days.push({ name, dateKey, count: 0 })
    }

    const registrations: any[] = Array.isArray(data) ? data : []
    for (const reg of registrations) {
      if (!reg?.createdAt) continue
      const dateKey = String(reg.createdAt).slice(0, 10)
      const bucket = days.find((d) => d.dateKey === dateKey)
      if (bucket) bucket.count += 1
    }

    const totalCount = days.reduce((acc, d) => acc + d.count, 0)
    return { buckets: days, total: totalCount }
  }, [data])

  const maxCount = buckets.reduce((max, d) => Math.max(max, d.count), 0)

  return (
    <div className='rounded-lg border bg-card p-6 shadow-sm'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold'>Registrations – Last 7 Days</h3>
          <p className='text-sm text-muted-foreground'>
            Total in last 7 days: {isLoading ? '...' : total}
          </p>
        </div>
      </div>

      <div className='h-64'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            Loading chart...
          </div>
        ) : (
          <>
            <ResponsiveContainer width='100%' height='80%'>
              <BarChart data={buckets}>
                <XAxis
                  dataKey='name'
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, maxCount || 1]}
                />
                <Bar
                  dataKey='count'
                  fill='currentColor'
                  radius={[4, 4, 0, 0]}
                  className='fill-primary'
                />
              </BarChart>
            </ResponsiveContainer>
            <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4'>
              {buckets.map((d) => (
                <div key={d.dateKey} className='flex items-center justify-between rounded bg-muted/40 px-2 py-1'>
                  <span className='font-medium'>{d.name}</span>
                  <span className='font-mono'>{d.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

