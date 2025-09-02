import { Button } from '@/components/ui/button';
import { type BountyType } from '@/generated/prisma/enums';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

interface AutoGenerateTypeProps {
  onSelect: (type: BountyType) => void;
}
export function AutoGenerateType({ onSelect }: AutoGenerateTypeProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Select type of listing</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button
          className="flex h-55 flex-col gap-4 whitespace-normal text-slate-500 hover:text-slate-500"
          variant="outline"
          onClick={() => onSelect('bounty')}
        >
          <BountyIcon
            className="fill-slate-500"
            styles={{
              width: '3rem',
              height: '3rem',
            }}
          />
          <span className="flex max-w-3/4 flex-col gap-1">
            <h3 className="text-base font-medium text-slate-900">Bounty</h3>
            <p className="text-sm font-normal">
              Get multiple submissions for your task, and reward the best work
            </p>
          </span>
        </Button>
        <Button
          className="flex h-55 flex-col gap-4 whitespace-normal text-slate-500 hover:text-slate-500"
          variant="outline"
          onClick={() => onSelect('project')}
        >
          <ProjectIcon
            className="fill-slate-500"
            styles={{
              width: '3rem',
              height: '3rem',
            }}
          />
          <span className="flex max-w-3/4 flex-col gap-1">
            <h3 className="text-base font-medium text-slate-900">Project</h3>
            <p className="text-sm font-normal">
              Receive proposals for your work and pick the right candidate
            </p>
          </span>
        </Button>
      </div>
    </div>
  );
}
