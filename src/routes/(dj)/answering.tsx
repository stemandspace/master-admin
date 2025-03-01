import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(dj)/answering')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(dj)/answering"!</div>
}
