'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { JTTG } from '@/constants/Telegram';
import { TERMS_OF_USE } from '@/constants/TERMS_OF_USE';
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

export const EntityNameModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const user = useViewer();
  const router = useRouter();
  if (!user?.currentSponsor?.id) return null;

  const setDBEntityName = async () => {
    setLoading(true);
    try {
      if (user.currentSponsor) {
        await postJson('/api/sponsors/update-entity-name/', {
          entityName,
        });
        router.refresh();
        onClose();
      }
    } catch (e) {
      console.error('unable to set entity name ', e);
      setError(true);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className="w-[480px] gap-6 overflow-hidden rounded-lg p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-start">
          <p className="mb-4 text-lg font-medium">Update Your Entity Name</p>
          <p className="text-sm text-slate-400">
            In accordance with our updated{' '}
            <Link
              href={TERMS_OF_USE}
              rel="noopener noreferrer"
              target="_blank"
              className="underline underline-offset-2"
            >
              Terms of Use
            </Link>
            , we need to know the name of the entity that controls your project.
            If you are a DAO, please mention the name of your DAO. If you{' '}
            {"don't "}
            have an entity, please mention your full name.
          </p>
        </div>

        <Input
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Entity Name"
          value={entityName}
        />

        <div className="flex gap-2">
          <Link
            href={JTTG}
            rel="noopener noreferrer"
            target="_blank"
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              Need Help?
            </Button>
          </Link>
          <Button
            className="w-full"
            onClick={() => void setDBEntityName()}
            disabled={loading}
          >
            {loading ? <span>Updating...</span> : <span>Update</span>}
          </Button>
        </div>

        {error && (
          <p className="text-center text-red-500">
            Some Error occurred, please try again later
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
