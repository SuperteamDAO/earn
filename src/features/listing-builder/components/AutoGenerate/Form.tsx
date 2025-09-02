import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type BountyType } from '@/generated/prisma/enums';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

interface AutoGenerateFormProps {
  type: BountyType;
  setType: (type: BountyType) => void;
  onBack?: () => void;
  onGenerate?: (data: {
    description: string;
    type: string;
    template?: string;
  }) => void;
}

export function AutoGenerateForm({
  type,
  setType,
  onBack: _onBack,
  onGenerate,
}: AutoGenerateFormProps) {
  const [description, setDescription] = useState('');
  const [_selectedTemplate, _setSelectedTemplate] = useState<string>('');

  const handleGenerate = () => {
    onGenerate?.({
      description,
      type,
      template: _selectedTemplate,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'bounty' ? (
            <BountyIcon
              styles={{ width: '1.2rem', height: '1.2rem' }}
              className="fill-gray-500"
            />
          ) : (
            <ProjectIcon
              styles={{ width: '1.2rem', height: '1.2rem' }}
              className="fill-gray-500"
            />
          )}
          <h2 className="text-lg font-medium">Generate your {type} with AI</h2>
        </div>
        <div>
          <Select
            value={type}
            onValueChange={(value) => setType(value as 'bounty' | 'project')}
          >
            <SelectTrigger className="h-8 w-auto font-medium text-slate-500">
              <div className="flex items-center gap-2 pr-2">
                {type === 'bounty' ? (
                  <BountyIcon
                    styles={{ width: '0.9rem', height: '0.9rem' }}
                    className="fill-gray-500"
                  />
                ) : (
                  <ProjectIcon
                    styles={{ width: '0.9rem', height: '0.9rem' }}
                    className="fill-gray-500"
                  />
                )}
                {type === 'bounty' ? 'Bounty' : 'Project'}
              </div>
            </SelectTrigger>
            <SelectContent className="font-medium text-slate-500">
              <SelectItem value="bounty">
                <div className="flex items-center gap-2">
                  <BountyIcon
                    styles={{ width: '0.9rem', height: '0.9rem' }}
                    className="fill-gray-500"
                  />
                  Bounty
                </div>
              </SelectItem>
              <SelectItem value="project">
                <div className="flex items-center gap-2">
                  <ProjectIcon
                    styles={{ width: '0.9rem', height: '0.9rem' }}
                    className="fill-gray-500"
                  />
                  Project
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div></div>

      <div className="space-y-4">
        <Textarea
          placeholder="Briefly describe the scope of your task"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-55 w-full resize-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={!description.trim()}
          className="w-full"
        >
          Generate {type}
        </Button>
      </div>
    </div>
  );
}
