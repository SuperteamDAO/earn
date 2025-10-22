import { redirect } from 'next/navigation';

export default async function BountiesAllRedirectPage() {
  redirect('/all/?tab=bounties');
}
