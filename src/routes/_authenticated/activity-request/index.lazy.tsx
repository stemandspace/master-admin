import Activity from '@/features/activity'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/activity-request/')({
  component: Activity,
})
