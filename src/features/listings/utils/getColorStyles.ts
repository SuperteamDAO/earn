export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return {
        bgColor: 'bg-emerald-100',
        color: 'text-teal-600',
        borderColor: 'border-emerald-200',
      };
    case 'Under Verification':
    case 'Fndn to Pay':
      return {
        bgColor: 'bg-pink-100',
        color: 'text-pink-500',
        borderColor: 'border-pink-200',
      };
    case 'Payment Pending':
      return {
        bgColor: 'bg-amber-100',
        color: 'text-amber-600',
        borderColor: 'border-amber-300',
      };
    case 'Verification Failed':
      return {
        bgColor: 'bg-red-100',
        color: 'text-red-400',
        borderColor: 'border-red-200',
      };
    case 'Draft':
      return {
        bgColor: 'bg-slate-100',
        color: 'text-slate-400',
        borderColor: 'border-slate-200',
      };
    case 'In Review':
      return {
        bgColor: 'bg-cyan-100',
        color: 'text-cyan-600',
        borderColor: 'border-cyan-200',
      };
    case 'In Progress':
      return {
        bgColor: 'bg-purple-100',
        color: 'text-violet-500',
        borderColor: 'border-purple-200',
      };
    case 'Unpublished':
      return {
        bgColor: 'bg-orange-50',
        color: 'text-orange-600',
        borderColor: 'border-orange-200',
      };
    default:
      return {
        bgColor: 'bg-gray-500',
        color: 'text-white',
        borderColor: 'border-gray-400',
      };
  }
};
