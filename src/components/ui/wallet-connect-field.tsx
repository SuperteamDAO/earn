import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import {
  type Control,
  type FieldValues,
  type Path,
  useFormContext,
} from 'react-hook-form';
import { BsWallet2 } from 'react-icons/bs';

import { cn } from '@/utils/cn';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';

interface WalletConnectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  isRequired?: boolean;
  className?: string;
}

export function WalletConnectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
  className,
}: WalletConnectFieldProps<T>) {
  const DynamicWalletMultiButton = dynamic(
    async () =>
      (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false },
  );

  const { publicKey, connected } = useWallet();
  const { setValue } = useFormContext();

  useEffect(() => {
    if (connected && publicKey) {
      setValue(name, publicKey.toString() as any, { shouldValidate: true });
    }
  }, [connected, publicKey, setValue, name]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col gap-2', className)}>
          <div>
            {label && <FormLabel isRequired={isRequired}>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <div className="flex flex-col gap-2">
              <DynamicWalletMultiButton
                style={{
                  height: '40px',
                  fontWeight: 600,
                  fontFamily: 'Inter',
                  paddingRight: '16px',
                  paddingLeft: '16px',
                  fontSize: '12px',
                  backgroundColor: connected ? '#27272a' : `#52525b`,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                <>
                  <BsWallet2 className="mr-2" />

                  {connected
                    ? truncatePublicKey(publicKey?.toBase58(), 5)
                    : 'Connect Wallet'}
                </>
              </DynamicWalletMultiButton>
              <Input
                type="hidden"
                {...field}
                value={publicKey?.toString() || ''}
              />
            </div>
          </FormControl>
          <FormMessage className="pt-1" />
        </FormItem>
      )}
    />
  );
}
