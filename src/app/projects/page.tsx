import { redirect } from 'next/navigation';

export default async function ProjectsRedirectPage() {
  redirect('/?tab=projects');
}
