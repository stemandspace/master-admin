import Submissions from '@/features/submissions'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/submissions/')({
  component: Submissions,
})
