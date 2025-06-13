import { createLazyFileRoute } from '@tanstack/react-router'
import Tasks from '@/features/daily-quiz'

export const Route = createLazyFileRoute('/_authenticated/daily-quiz/')({
  component: Tasks,
})
