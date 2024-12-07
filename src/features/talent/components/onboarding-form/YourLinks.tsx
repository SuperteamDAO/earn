import axios from 'axios';
import { Loader2, Pencil, Plus, Trash } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { useUser } from '@/store/user';

import { AddProject } from '../AddProject';
import { SocialInput } from '../SocialInput';
import type { UserStoreType } from './types';

interface Props {
  setStep?: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function YourLinks({ useFormStore }: Props) {
  const { refetchUser } = useUser();
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
      twitter: string;
      github: string;
      linkedin: string;
      telegram: string;
      website: string;
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
      const { subSkills, ...finalOptions } = updateOptions;

      await axios.post('/api/user/complete-profile/', finalOptions);
      await axios.post('/api/email/manual/welcome-talent/');
      await refetchUser();
    } catch (e) {
      setisLoading(false);
    }
  };

  const { register, handleSubmit, watch } = useForm();

  const onSubmit = (data: any) => {
    const socialFields = [
      'twitter',
      'github',
      'linkedin',
      'website',
      'telegram',
    ];
    const filledSocials = socialFields.filter((field) => data[field]);

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return;
    }

    posthog.capture('finish profile_talent');
    uploadProfile(
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
  };
  return (
    <>
      <div className="mb-[4rem] w-full">
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FormControl className="mb-5 w-full">
            <SocialInput watch={watch} register={register} />
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
              className="mb-8 w-full"
              onClick={() => {
                onOpen();
              }}
              variant="outline"
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
          </FormControl>
        </form>
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
