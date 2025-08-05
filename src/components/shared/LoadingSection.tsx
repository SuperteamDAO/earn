import { Loading } from './Loading';

export function LoadingSection() {
  return (
    <div className="flex min-h-[92vh] w-full items-center justify-center">
      <div className="flex translate-y-[-2.5rem] flex-col items-center justify-center">
        <Loading />
        <span className="mt-2 translate-x-[0.5rem] text-slate-300">
          Loading...
        </span>
      </div>
    </div>
  );
}
