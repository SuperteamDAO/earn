import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils";
import { useAtomValue } from "jotai";
import { listingStatusAtom } from "../../atoms";

interface StatusBadgeProps {
  className?: string;
}

export function StatusBadge({ className }: StatusBadgeProps) {
  const status = useAtomValue(listingStatusAtom)
  const statusConfig = {
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-500 hover:bg-slate-100"
    },
    published: {
      label: "Published",
      className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
    },
    unpublished: {
      label: "Unpublished",
      className: "bg-orange-50 text-orange-600 hover:bg-orange-50"
    },
    verifying: {
      label: "Verifying",
      className: "bg-yellow-50 text-yellow-600 hover:bg-yellow-50"
    },
  };

  const config = statusConfig[status || 'draft'];

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-medium rounded-full",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
