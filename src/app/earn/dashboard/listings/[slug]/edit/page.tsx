import { BuilderPage, builderMetadata } from '../../../new/builder-page';

export const metadata = builderMetadata;

export default async function EditListing({
  params,
}: PageProps<'/earn/dashboard/listings/[slug]/edit'>) {
  const { slug } = await params;
  return (
    <BuilderPage
      route="edit"
      slug={slug}
      here={`/earn/dashboard/listings/${encodeURIComponent(slug)}/edit/`}
    />
  );
}
