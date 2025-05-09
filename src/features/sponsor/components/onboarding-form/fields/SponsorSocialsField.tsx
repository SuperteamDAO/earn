import { Info, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Tooltip } from '@/components/ui/tooltip';

import { SocialInput } from '@/features/social/components/SocialInput';
import { type SponsorFormValues } from '@/features/sponsor/utils/sponsorFormSchema';

type SocialTypeWithoutLinkedin =
  | 'twitter'
  | 'github'
  | 'discord'
  | 'linkedinCompany'
  | 'telegram'
  | 'website';

const ALL_SPONSOR_SOCIALS: SocialTypeWithoutLinkedin[] = [
  'twitter',
  'github',
  'discord',
  'linkedinCompany',
  'telegram',
  'website',
];

export function SponsorSocialsField() {
  const form = useFormContext<SponsorFormValues>();
  const { control, setValue } = form;

  const [selectedSocials, setSelectedSocials] = useState<
    SocialTypeWithoutLinkedin[]
  >(['website']);

  const handleToggleSocial = (
    social: SocialTypeWithoutLinkedin,
    checked: boolean,
  ) => {
    if (social === 'website' && !checked) {
      return; // Prevent removing the mandatory website field
    }
    setSelectedSocials((prev) => {
      if (checked) {
        if (!prev.includes(social)) {
          return [...prev, social];
        }
        return prev;
      } else {
        setValue(`sponsor.${social}`, '');
        return prev.filter((s) => s !== social);
      }
    });
  };

  const orderedSelectedSocials = useMemo(() => {
    // Ensure website is always first and required
    const socials = selectedSocials.filter((s) => s !== 'website');
    return ['website', ...socials] as SocialTypeWithoutLinkedin[];
  }, [selectedSocials]);

  return (
    <div>
      <div className="flex justify-between">
        <div>
          <span className="flex items-center gap-2">
            <Label className="text-[0.85rem] text-slate-600 sm:text-[0.9rem]">
              Socials{' '}
            </Label>
            <div className="lg:hidden">
              <Tooltip content={'Provide at least the Website URL.'}>
                <Info className="h-3 w-3 text-slate-500" />
              </Tooltip>
            </div>
          </span>
          <p className="mt-0 hidden text-xs text-muted-foreground text-slate-500 sm:text-[0.8rem] lg:block">
            Provide at least the Website URL.
          </p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 items-center gap-1 px-1 text-[0.7rem] text-primary"
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
              {ALL_SPONSOR_SOCIALS.map((social) => {
                const isChecked = selectedSocials.includes(social);
                const isDisabled = social === 'website'; // Disable removing website
                return (
                  <DropdownMenuCheckboxItem
                    key={social as string}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked) =>
                      handleToggleSocial(social, checked)
                    }
                    className="capitalize"
                    onSelect={(e) => e.preventDefault()}
                  >
                    {social}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-1 flex flex-col gap-3 md:mt-4">
        {orderedSelectedSocials.map((social) => (
          <div className="group relative" key={social}>
            <SocialInput
              control={control}
              name={`sponsor.${social}`}
              socialName={social}
              required={social === 'website'}
              placeholder={
                social !== 'website' && social !== 'discord'
                  ? `Enter Entity ${social?.charAt(0).toUpperCase() + social?.slice(1).toLowerCase()} username`
                  : `Enter Entity ${social?.charAt(0).toUpperCase() + social?.slice(1).toLowerCase()} URL`
              }
              height="h-[2.3rem]"
              classNames={{
                input: social === 'website' ? '' : 'pr-8', // No padding for website
              }}
            />
            {social !== 'website' && (
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
