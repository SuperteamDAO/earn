import EarnFlippingIcon from '../icons/earn-flipping-icon/EarnFlippingIcon';

export function LoadingSection() {
  return (
    <div className="flex min-h-[100vh] w-full items-center justify-center">
      <div className="flex translate-y-[-2.5rem] flex-col items-center justify-center">
        <EarnFlippingIcon />
        <span className="mt-2 translate-x-[-0.3rem] animate-pulse text-slate-400">
          Loading...
        </span>
      </div>
    </div>
  );
}
