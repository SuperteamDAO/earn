import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Not Found | Superteam Earn',
  description: '404 - Page Not Found',
  noIndex: true,
});

// Earn's 404 (pages/earn/404.tsx), for anything under /earn that isn't
// there.
export default function NotFound() {
  return (
    <Default>
      <div className="flex flex-col items-center justify-center gap-4">
        <ExternalImage alt="404 page" src={'/bg/404.svg'} />
        <p className="text-xl font-medium text-black">Nothing Found</p>
        <p className="max-w-2xl text-center text-base text-gray-500 lg:text-lg">
          Sorry, we couldn&apos;t find what you were looking for. It’s probably
          your own fault, please check your spelling or meanwhile have a look at
          this cat
        </p>
        <ExternalImage
          className="mb-72 w-[20rem] lg:w-[30rem]"
          alt="cat image"
          src={'/bg/cat.png'}
        />
      </div>
    </Default>
  );
}
