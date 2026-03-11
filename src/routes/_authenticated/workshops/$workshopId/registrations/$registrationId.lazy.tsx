import { createLazyFileRoute } from '@tanstack/react-router'
import WorkshopRegistrationDetail from '@/features/workshops/workshop-registration-detail'

export const Route = createLazyFileRoute(
  '/_authenticated/workshops/$workshopId/registrations/$registrationId'
)({
  component: WorkshopRegistrationDetail,
})

