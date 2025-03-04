import { createLazyFileRoute } from '@tanstack/react-router'
import Challenges from '@/features/challenges'

export const Route = createLazyFileRoute('/_authenticated/challenges/')({
  component: Challenges,
})
