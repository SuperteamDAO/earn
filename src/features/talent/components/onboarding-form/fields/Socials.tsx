import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

import { SocialInput } from '@/features/social/components/SocialInput';
import { type SocialType } from '@/features/social/utils/constants';
import { type NewTalentFormData } from '@/features/talent/schema';
import { hasDevSkills } from '@/features/talent/utils/skills';

const ALL_SOCIALS: SocialType[] = [
  'twitter',
  'github',
  'discord',
  'linkedin',
  'telegram',
  'website',
];

export function SocialsField() {
  const form = useFormContext<NewTalentFormData>();
  const { control, watch, clearErrors, getValues, setValue } = form;

  const [selectedSocials, setSelectedSocials] = useState<SocialType[]>([
    'twitter',
  ]);

  const skills = watch('skills');
  const requiredSocial = useMemo(() => {
    if (hasDevSkills(skills)) {
      clearErrors('twitter');
      return 'github';
    } else {
      clearErrors('github');
      return 'twitter';
    }
  }, [skills]);

  useEffect(() => {
    const twitter = getValues('twitter');
    const github = getValues('github');
    setSelectedSocials((prev) => {
      const newSocials: SocialType[] = [requiredSocial];
      if (requiredSocial === 'twitter' && !!github) {
        newSocials.push('github');
      }
      if (requiredSocial === 'github' && !!twitter) {
        newSocials.push('twitter');
      }
      newSocials.push(
        ...prev.filter(
          (s) => s !== requiredSocial && s !== 'github' && s !== 'twitter',
        ),
      );
      return newSocials;
    });
  }, [requiredSocial]);

  const handleToggleSocial = (social: SocialType, checked: boolean) => {
    if (social === requiredSocial && !checked) {
      return;
    }
    setSelectedSocials((prev) => {
      if (checked) {
        if (!prev.includes(social)) {
          return [...prev, social];
        }
        return prev;
      } else {
        setValue(social, '');
        return prev.filter((s) => s !== social);
      }
    });
  };

  const orderedSelectedSocials = useMemo(() => {
    return [
      requiredSocial,
      ...selectedSocials.filter((s) => s !== requiredSocial),
    ] as SocialType[];
  }, [selectedSocials, requiredSocial]);

  return (
    <div>
      <div className="flex justify-between">
        <div>
          <Label>Socials </Label>
          <p className="mt-0 text-[0.8rem] text-muted-foreground text-slate-500">
            Fill at least one, but more the merrier
          </p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="items-center gap-1 text-[0.7rem] text-primary"
              >
                <Plus className="!h-3 !w-3" />
                ADD MORE
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-2 w-fit">
              <DropdownMenuLabel className="font-medium">
                Choose Socials
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_SOCIALS.map((social) => {
                const isChecked = selectedSocials.includes(social);
                const isDisabled = social === requiredSocial && isChecked;
                return (
                  <DropdownMenuCheckboxItem
                    key={social}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked) =>
                      handleToggleSocial(social, checked)
                    }
                    className="capitalize"
                  >
                    {social}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {orderedSelectedSocials.map((social) => (
          <div className="group relative" key={social}>
            <SocialInput
              control={control}
              name={social}
              socialName={social}
              required={social === requiredSocial}
              placeholder={`Enter your ${social} username or URL`}
              height="h-[2.3rem]"
              classNames={{
                input: 'pr-8',
              }}
            />
            {social !== requiredSocial && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleToggleSocial(social, false)}
                className="absolute right-0 top-0 flex text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}