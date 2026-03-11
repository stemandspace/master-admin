import { createLazyFileRoute } from '@tanstack/react-router'
import WorkshopDetail from '@/features/workshops/workshop-detail'

export const Route = createLazyFileRoute(
  '/_authenticated/workshops/$workshopId'
)({
  component: WorkshopDetail,
})

