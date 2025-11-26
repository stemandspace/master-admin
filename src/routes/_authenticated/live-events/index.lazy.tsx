import { createLazyFileRoute } from '@tanstack/react-router'
import LiveEvents from '@/features/live-events'

export const Route = createLazyFileRoute('/_authenticated/live-events/')({
  component: LiveEvents,
})
