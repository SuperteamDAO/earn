import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

const thClassName = 'text-xs font-medium tracking-wider text-slate-500';

export const UserTableSkeleton = ({ rows = 10 }: { rows?: number }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100">
            <TableHead className={cn(thClassName, 'pr-2')}># Rank</TableHead>
            <TableHead className={thClassName}>User</TableHead>
            <TableHead className={cn(thClassName, 'px-1')}>$ Earned</TableHead>
            <TableHead className={cn(thClassName, 'px-0 text-center')}>
              Submissions
            </TableHead>
            <TableHead className={cn(thClassName, 'px-1 text-center')}>
              Wins
            </TableHead>
            <TableHead className={thClassName}>Skills</TableHead>
            <TableHead className={thClassName}>Socials</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="w-12 p-1">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-8" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-2">
                    <Skeleton className="mb-1 h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-1">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="p-0">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-6" />
                </div>
              </TableCell>
              <TableCell className="p-1">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-6" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-16 gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
