import { Plus } from 'lucide-react';
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
  const { control, watch, clearErrors } = form;

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
    setSelectedSocials((prev) => {
      if (prev.includes(requiredSocial)) {
        return [
          requiredSocial,
          ...prev.filter(
            (s) => s !== requiredSocial && s !== 'github' && s !== 'twitter',
          ),
        ];
      }
      return [
        requiredSocial,
        ...prev.filter((s) => s !== 'github' && s !== 'twitter'),
      ];
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
            fill at least one, but more the merrier
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
            <DropdownMenuContent className="w-fit">
              <DropdownMenuLabel>Choose Socials</DropdownMenuLabel>
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
          <SocialInput
            key={social}
            control={control}
            name={social}
            socialName={social}
            required={social === requiredSocial}
            placeholder={`Enter your ${social} username or URL`}
            height="h-[2.3rem]"
          />
        ))}
      </div>
    </div>
  );
}
