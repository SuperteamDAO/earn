import { ChevronDown } from 'lucide-react';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type BountyType } from '@/generated/prisma/enums';

import { BountyTemplates, ProjectTemplates } from './template-prompts';

interface TemplatesProps {
  type: BountyType;
  onSelectTemplate?: (template: { name: string; prompt: string }) => void;
}

export function Templates({ type, onSelectTemplate }: TemplatesProps) {
  const templates =
    type === 'bounty'
      ? BountyTemplates
      : type === 'project'
        ? ProjectTemplates
        : [];
  const showDropdown = templates.length > 4;
  const visibleTemplates = showDropdown ? templates.slice(0, 3) : templates;
  const hiddenTemplates = showDropdown ? templates.slice(3) : [];

  const handleTemplateSelect = (template: {
    name: string;
    prompt: string;
    icon: any;
  }) => {
    posthog.capture('select template_auto-generate');
    onSelectTemplate?.(template);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {visibleTemplates.map((template) => {
        const IconComponent = template.icon;
        return (
          <Button
            key={template.name}
            variant="outline"
            className="flex h-8 items-center gap-2 px-3 py-2"
            onClick={() => handleTemplateSelect(template)}
          >
            <IconComponent className="h-4 w-4" />
            <span className="text-xs">{template.name}</span>
          </Button>
        );
      })}

      {hiddenTemplates.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex h-auto items-center gap-2 px-3 py-2"
            >
              <span className="text-xs">More Templates</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-100 w-48">
            {hiddenTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <DropdownMenuItem
                  key={template.name}
                  className="flex cursor-pointer items-center gap-2 text-slate-500"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs">{template.name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
