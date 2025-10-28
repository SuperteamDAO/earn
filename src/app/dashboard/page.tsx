import { permanentRedirect } from 'next/navigation';

export default async function DashboardRedirectPage() {
  permanentRedirect('/dashboard/listings');
}
