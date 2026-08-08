import { redirect } from 'next/navigation'

// The essence profile content is now merged into the client Profile page.
// Old /dashboard/client/{clientKey}/essence-profile URLs redirect there.
export default async function EssenceProfileRedirect({ params }: { params: Promise<{ clientKey: string }> }) {
  const { clientKey } = await params
  redirect(`/dashboard/client/${clientKey}/profile`)
}
