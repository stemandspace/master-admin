import { createLazyFileRoute } from '@tanstack/react-router'
import Workshops from '@/features/workshops'

export const Route = createLazyFileRoute('/_authenticated/workshops/')({
  component: Workshops,
})

