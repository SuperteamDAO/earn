import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Loader2, Pencil, Plus, Trash } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { useUser } from '@/store/user';

import { SocialInputAll } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

import { ONBOARDING_KEY } from '../../constants';
import { type YourLinksFormData, yourLinksSchema } from '../../schema';
import { AddProject } from '../AddProject';
import type { UserStoreType } from './types';

interface Props {
  setStep?: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function YourLinks({ useFormStore }: Props) {
  const { refetchUser, user } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { form } = useFormStore();
  const [pow, setPow] = useState<PoW[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { updateState } = useFormStore();

  const posthog = usePostHog();

  const uploadProfile = async (
    socials: {
      discord: string;
      twitter?: string;
      github?: string;
      linkedin?: string;
      telegram?: string;
      website?: string;
    },
    pow: PoW[],
  ) => {
    updateState({ ...socials });
    setisLoading(true);
    try {
      await axios.post('/api/pow/create', {
        pows: pow,
      });

      const updateOptions = {
        ...form,
        ...socials,
      };
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { ...finalOptions } = updateOptions;

      await axios.post('/api/user/complete-profile/', finalOptions);
      await axios.post('/api/email/manual/welcome-talent/');
      await refetchUser();
    } catch (e) {
      setisLoading(false);
    }
  };

  const yourLinksForm = useForm<YourLinksFormData>({
    resolver: zodResolver(yourLinksSchema),
    mode: 'onBlur',
  });
  const { handleSubmit, control, setValue, reset, watch } = yourLinksForm;

  useEffect(() => {
    if (user) {
      reset({
        discord: form.discord || user.discord || undefined,
        github:
          form.github ||
          extractSocialUsername('github', user.github || '') ||
          undefined,
        twitter:
          form.twitter ||
          extractSocialUsername('twitter', user.twitter || '') ||
          undefined,
        linkedin:
          form.linkedin ||
          extractSocialUsername('linkedin', user.linkedin || '') ||
          undefined,
        telegram:
          form.telegram ||
          extractSocialUsername('telegram', user.telegram || '') ||
          undefined,
        website: user.website || undefined,
      });
    }
  }, [user, setValue]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (values) {
        updateState({
          ...form,
          discord: values.discord || '',
          github: values.github || undefined,
          twitter: values.twitter || undefined,
          linkedin: values.linkedin || undefined,
          telegram: values.telegram || undefined,
          website: values.website || undefined,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateState]);

  const onSubmit = async (data: YourLinksFormData) => {
    posthog.capture('finish profile_talent');
    await uploadProfile(
      {
        discord: data.discord,
        twitter: data.twitter,
        github: data.github,
        linkedin: data.linkedin,
        telegram: data.telegram,
        website: data.website,
      },
      pow,
    );
    localStorage.removeItem(ONBOARDING_KEY);
  };
  return (
    <>
      <div className="mb-[4rem] w-full">
        <Form {...yourLinksForm}>
          <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-5 w-full">
              <SocialInputAll control={control} />
              <p className="font-medium text-slate-500">Other Proof of Work</p>
              <p className="mb-3 text-slate-400">
                Adding more PoW increases your chance of getting work
              </p>
              <div>
                {pow.map((data, idx) => (
                  <div
                    className="mb-1.5 mt-2 flex items-center rounded-md border border-gray-300 px-[1rem] py-[0.5rem] text-slate-500"
                    key={data.id}
                  >
                    <p className="w-full text-xs text-gray-800">{data.title}</p>
                    <div className="flex items-center justify-center gap-3.5">
                      <Pencil
                        onClick={() => {
                          setSelectedProject(idx);
                          onOpen();
                        }}
                        className="h-3.5 w-3.5 cursor-pointer"
                      />
                      <Trash
                        onClick={() => {
                          setPow((prevPow) =>
                            prevPow.filter((_ele, id) => idx !== id),
                          );
                        }}
                        className="h-3.5 w-3.5 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="mb-8 w-full bg-transparent"
                onClick={() => {
                  onOpen();
                }}
                variant="outline"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>

              <Button
                className="ph-no-capture h-[50px] w-full bg-[rgb(101,98,255)] text-white"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Finish Profile'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <AddProject
        key={`${pow.length}project`}
        {...{
          isOpen,
          onClose,
          pow,
          setPow,
          selectedProject,
          setSelectedProject,
        }}
      />
    </>
  );
}
