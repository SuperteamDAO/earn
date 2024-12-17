import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { type Dispatch, type SetStateAction, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { Textarea } from '@/components/ui/textarea';
import { URL_REGEX } from '@/constants/URL_REGEX';
import type { PoW } from '@/interface/pow';
import { allSkills, allSubSkills } from '@/interface/skills';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { type FeedDataProps } from '@/features/feed/types';

const PowSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  link: z.union([z.literal(''), z.string().regex(URL_REGEX, 'Invalid URL')]),
  skills: z.enum(allSkills).array().default([]),
  subSkills: z.enum(allSubSkills).array().default([]),
});
type PowFormData = z.infer<typeof PowSchema>;

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
  const form = useForm<PowFormData>({
    resolver: zodResolver(PowSchema),
  });
  const { handleSubmit, setValue, watch, control } = form;

  const { user } = useUser();

  const skillsOptions = useMemo<Option[]>(
    () =>
      allSkills.map((i) => ({
        value: i,
        label: i,
      })),
    [allSkills],
  );
  const subSkillsOptions = useMemo<Option[]>(
    () =>
      allSubSkills.map((i) => ({
        value: i,
        label: i,
      })),
    [allSubSkills],
  );

  const projectToEdit =
    selectedProject !== null && pow ? pow[selectedProject as number] : null;

  useEffect(() => {
    if (!isOpen) {
      setValue('title', '');
      setValue('description', '');
      setValue('link', '');
      setValue('skills', []);
      setValue('subSkills', []);
      if (setSelectedProject) {
        setSelectedProject(null);
      }
    } else if (projectToEdit && setSelectedProject) {
      setValue('title', projectToEdit.title);
      setValue('description', projectToEdit.description);
      setValue('link', projectToEdit.link);
      setValue(
        'skills',
        PowSchema.shape.skills.safeParse(projectToEdit.skills).data || [],
      );
      setValue(
        'subSkills',
        PowSchema.shape.subSkills.safeParse(projectToEdit.subSkills).data || [],
      );
    }
  }, [isOpen, projectToEdit, setValue, setSelectedProject]);

  const onSubmit = async (data: PowFormData): Promise<void> => {
    const projectData: PoW & Partial<FeedDataProps> = {
      title: data.title,
      description: data.description,
      link: data.link,
      skills: data.skills,
      subSkills: data.subSkills,
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
      <DialogContent className="max-w-[607px] py-[1.4375rem]">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <FormFieldWrapper
                isRequired
                name="title"
                label="Project Title"
                control={control}
              >
                <Input placeholder="Project Title" />
              </FormFieldWrapper>

              <FormField
                control={control}
                name={'description'}
                render={({ field }) => (
                  <FormItem className={cn('mb-5 flex flex-col gap-2')}>
                    <div>
                      <FormLabel isRequired>Description</FormLabel>
                    </div>
                    <div>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={180}
                          placeholder="Project Description"
                        />
                      </FormControl>
                      <p
                        className={cn(
                          'mt-1 text-right text-xs',
                          (watch('description')?.length || 0) > 160
                            ? 'text-red-500'
                            : 'text-slate-400',
                        )}
                      >
                        {180 - (watch('description')?.length || 0)} characters
                        left
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                name="skills"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel isRequired>Skills</FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={skillsOptions}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="subSkills"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel isRequired>Sub Skills</FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={subSkillsOptions}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormFieldWrapper
                name="link"
                label="Link"
                control={control}
                isRequired
              >
                <Input placeholder="https://example.com" />
              </FormFieldWrapper>

              <Button
                className="h-[50px] w-full bg-[rgb(101,98,255)] text-white"
                type="submit"
              >
                Add Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
