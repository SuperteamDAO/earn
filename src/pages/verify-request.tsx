import { Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function VerifyRequest() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForSignIn');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const verifyOTP = (value: string) => {
    const token = value.trim();
    const encodedEmail = encodeURIComponent(email);
    const apiUrl = `/api/auth/callback/email?token=${token}&email=${encodedEmail}`;
    router.push(apiUrl);
  };

  return (
    <>
      <div className="border-b-2 py-3">
        <Link href="/" className="mx-auto block w-fit">
          <Image
            height={24}
            width={100}
            className="mx-auto cursor-pointer object-contain"
            alt="Superteam Earn"
            src="/assets/logo.svg"
          />
        </Link>
      </div>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-3">
        <h1 className="mt-16 text-center text-2xl text-[#1E293B] md:text-[28px]">
          We just sent an OTP
        </h1>
        <p className="text-center text-lg text-[#475569] md:text-xl">
          On your email {email}
        </p>
        <div className="mx-auto my-16 flex h-32 w-32 items-center justify-center rounded-full bg-[#EEF2FF]">
          <Mail size={32} />
        </div>
        <FormField
          name="otp"
          render={() => (
            <FormItem>
              <FormControl>
                <InputOTP maxLength={6} onComplete={verifyOTP}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="border-gray-400" />
                    <InputOTPSlot index={1} className="border-gray-400" />
                    <InputOTPSlot index={2} className="border-gray-400" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="border-gray-400" />
                    <InputOTPSlot index={4} className="border-gray-400" />
                    <InputOTPSlot index={5} className="border-gray-400" />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
