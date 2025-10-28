import { redirect } from 'next/navigation';

export default async function BountiesRedirectPage() {
  redirect('/?tab=bounties');
}
