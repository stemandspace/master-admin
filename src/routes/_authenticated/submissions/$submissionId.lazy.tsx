import SubmissionDetail from '@/features/submissions/submission-detail'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/submissions/$submissionId'
)({
  component: SubmissionDetail,
})
