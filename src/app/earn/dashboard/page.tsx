import { permanentRedirect } from 'next/navigation';

// The dashboard opens on the sponsor's listings.
export default function DashboardIndex() {
  permanentRedirect('/earn/dashboard/listings/');
}
