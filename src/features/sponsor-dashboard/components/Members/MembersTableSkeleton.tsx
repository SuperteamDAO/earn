import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const thClassName =
  'text-sm font-medium tracking-tight text-slate-400 uppercase';

export const MembersTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="text-slate-100">
            <TableHead className={thClassName}>Member</TableHead>
            <TableHead className={thClassName}>Role</TableHead>
            <TableHead className={thClassName}>Email</TableHead>
            <TableHead className="text-sm" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-2">
                    <Skeleton className="mb-1 h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
