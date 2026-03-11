import { createLazyFileRoute } from '@tanstack/react-router'
import WorkshopRegistrations from '@/features/workshops/workshop-registrations'

export const Route = createLazyFileRoute(
  '/_authenticated/workshops/$workshopId/registrations'
)({
  component: WorkshopRegistrations,
})

