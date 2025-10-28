import { redirect } from 'next/navigation';

export default async function ProjectsAllRedirectPage() {
  redirect('/all/?tab=projects');
}
