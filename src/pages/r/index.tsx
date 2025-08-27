import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReferralIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <div className="container mx-auto flex max-w-xl justify-center">
      <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white px-6 py-10 shadow-lg sm:px-12">
        <div className="flex flex-col items-center">
          <h1 className="text-center text-2xl font-semibold text-slate-700">
            Have a referral code?
          </h1>
          <div className="mt-6 flex w-full items-center gap-2">
            <Input
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Button
              onClick={() => {
                const next = code.trim().toUpperCase();
                if (!next) return;
                router.push(`/r/${next}`);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
