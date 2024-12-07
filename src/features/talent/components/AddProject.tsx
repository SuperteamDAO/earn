import axios from 'axios';
import { Link2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { SkillSelect } from '@/components/shared/SkillSelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MultiSelectOptions } from '@/constants';
import { type FeedDataProps } from '@/features/feed';
import type { PoW } from '@/interface/pow';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

type AddProjectProps = {
  isOpen: boolean;
  onClose: () => void;
  pow?: PoW[];
  setPow?: Dispatch<SetStateAction<PoW[]>>;
  selectedProject?: number | null;
  setSelectedProject?: (selectedProject: number | null) => void;
  upload?: boolean;
  onNewPow?: (newPow: PoW) => void;
};

export const AddProject = ({
  isOpen,
  onClose,
  pow,
  setPow,
  selectedProject,
  setSelectedProject,
  upload,
  onNewPow,
}: AddProjectProps) => {
  const { register, handleSubmit, setValue, watch } = useForm<{
    title: string;
    description: string;
    link: string;
    skills: MultiSelectOptions[];
    subSkills: MultiSelectOptions[];
  }>();

  const [skillsError, setSkillsError] = useState<boolean>(false);
  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const { user } = useUser();

  const projectToEdit =
    selectedProject !== null && pow ? pow[selectedProject as number] : null;

  useEffect(() => {
    if (!isOpen) {
      setValue('title', '');
      setValue('description', '');
      setValue('link', '');
      setSkills([]);
      setSubSkills([]);
      if (setSelectedProject) {
        setSelectedProject(null);
      }
    } else if (projectToEdit && setSelectedProject) {
      setValue('title', projectToEdit.title);
      setValue('description', projectToEdit.description);
      setValue('link', projectToEdit.link);
      setSkills(
        projectToEdit.skills.map((value: string) => ({ label: value, value })),
      );
      setSubSkills(
        projectToEdit.subSkills.map((value: string) => ({
          label: value,
          value,
        })),
      );
    }
  }, [isOpen, projectToEdit, setValue, setSelectedProject]);

  const onSubmit = async (data: any): Promise<void> => {
    let error = false;

    if (skills.length === 0 || subSkills.length === 0) {
      setSkillsError(true);
      error = true;
    } else {
      setSkillsError(false);
    }

    if (error) {
      return;
    }

    const projectData: PoW & Partial<FeedDataProps> = {
      title: data.title,
      description: data.description,
      link: data.link,
      skills: skills.map((ele) => ele.value),
      subSkills: subSkills.map((ele) => ele.value),
      firstName: user?.firstName,
      lastName: user?.lastName,
      photo: user?.photo,
      createdAt: new Date().toISOString(),
    };

    if (upload) {
      try {
        await axios.post('/api/pow/create', {
          pows: [
            {
              title: projectData.title,
              description: projectData.description,
              link: projectData.link,
              skills: projectData.skills,
              subSkills: projectData.subSkills,
            },
          ],
        });
        if (onNewPow) {
          onNewPow(projectData);
        }
      } catch (e) {
        console.error('Error posting to DB:', e);
        return;
      }
    } else if (setPow && setSelectedProject !== undefined) {
      if (selectedProject !== null) {
        setPow((prevPow) => {
          const updatedPow = [...prevPow!];
          updatedPow[selectedProject as number] = {
            ...updatedPow[selectedProject as number],
            ...projectData,
          };
          return updatedPow;
        });
        setSelectedProject(null);
      } else {
        setPow((prevPow) => [...prevPow!, projectData]);
      }
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-w-[607px] py-[1.4375rem]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <FormItem>
              <FormLabel className="text-slate-500">Project Title</FormLabel>
              <FormControl>
                <Input
                  className="border-slate-300 placeholder:text-slate-300 focus:border-purple-600 focus:ring-purple-600"
                  placeholder="Project Title"
                  {...register('title', { required: true })}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel className="text-slate-500">
                Describe Your Work
              </FormLabel>
              <FormControl>
                <Textarea
                  className="border-slate-300 placeholder:text-slate-300 focus:border-purple-600 focus:ring-purple-600"
                  maxLength={180}
                  placeholder="About the Project"
                  {...register('description', { required: true })}
                />
              </FormControl>
              <p
                className={cn(
                  'text-right text-xs',
                  (watch('description')?.length || 0) > 160
                    ? 'text-red-500'
                    : 'text-slate-400',
                )}
              >
                {180 - (watch('description')?.length || 0)} characters left
              </p>
            </FormItem>

            <SkillSelect
              skills={skills}
              subSkills={subSkills}
              setSkills={setSkills}
              setSubSkills={setSubSkills}
              skillLabel="Skills Used"
              subSkillLabel="Sub Skills Used"
            />

            <FormItem>
              <FormLabel className="text-slate-500">Link</FormLabel>
              <FormControl>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                  <Input
                    className="border-slate-300 pl-10 placeholder:text-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    placeholder="https://example.com"
                    {...register('link', { required: true })}
                  />
                </div>
              </FormControl>
            </FormItem>

            {skillsError && (
              <p className="text-sm text-red-500">
                Please add Skills and Sub Skills
              </p>
            )}

            <Button
              className="h-[50px] w-full bg-[rgb(101,98,255)] text-white"
              type="submit"
            >
              Add Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
