import { Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { PROJECT_NAME } from '@/constants/project';

export default function VerifyRequest() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForSignIn');
    if (storedEmail) {
      setEmail(storedEmail?.toLowerCase() || '');
    }
  }, []);

  const verifyOTP = (value: string) => {
    const token = value.trim();
    const encodedEmail = encodeURIComponent(email);
    const apiUrl = `/api/auth/callback/email?token=${token}&email=${encodedEmail}`;
    router.push(apiUrl);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <div className="border-b-2 py-3">
        <Link href="/" className="mx-auto block w-fit">
          <Image
            height={24}
            width={100}
            className="mx-auto cursor-pointer object-contain"
            alt={PROJECT_NAME}
            src="/assets/logo.svg"
          />
        </Link>
      </div>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-3">
        <h1 className="mt-16 text-center text-2xl text-slate-800 md:text-[28px]">
          We just sent an OTP
        </h1>
        <p className="text-center text-lg text-slate-600 md:text-xl">
          On your email {email}
        </p>
        <div className="mx-auto my-16 flex h-32 w-32 items-center justify-center rounded-full bg-indigo-50">
          <Mail size={32} className="text-slate-500" />
        </div>

        <InputOTP
          ref={inputRef}
          maxLength={6}
          onComplete={verifyOTP}
          autoFocus
          inputMode="numeric"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="border-gray-400" />
            <InputOTPSlot index={1} className="border-gray-400" />
            <InputOTPSlot index={2} className="border-gray-400" />
            <InputOTPSlot index={3} className="border-gray-400" />
            <InputOTPSlot index={4} className="border-gray-400" />
            <InputOTPSlot index={5} className="border-gray-400" />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </>
  );
}
