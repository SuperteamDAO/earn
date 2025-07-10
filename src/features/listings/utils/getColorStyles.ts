export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return {
        bgColor: 'bg-emerald-100',
        color: 'text-teal-600',
        borderColor: 'border-emerald-200',
        focus: 'focus:bg-emerald-200 focus:text-teal-700',
      };
    case 'Under Verification':
    case 'Fndn to Pay':
      return {
        bgColor: 'bg-pink-100',
        color: 'text-pink-500',
        borderColor: 'border-pink-200',
        focus: 'focus:bg-pink-200 focus:text-pink-700',
      };
    case 'Payment Pending':
      return {
        bgColor: 'bg-amber-100',
        color: 'text-amber-600',
        borderColor: 'border-amber-300',
        focus: 'focus:bg-amber-200 focus:text-amber-700',
      };
    case 'Verification Failed':
      return {
        bgColor: 'bg-red-100',
        color: 'text-red-400',
        borderColor: 'border-red-200',
        focus: 'focus:bg-red-200 focus:text-red-700',
      };
    case 'Draft':
      return {
        bgColor: 'bg-slate-100',
        color: 'text-slate-400',
        borderColor: 'border-slate-200',
        focus: 'focus:bg-slate-200 focus:text-slate-700',
      };
    case 'In Review':
      return {
        bgColor: 'bg-cyan-100',
        color: 'text-cyan-600',
        borderColor: 'border-cyan-200',
        focus: 'focus:bg-cyan-200 focus:text-cyan-700',
      };
    case 'In Progress':
      return {
        bgColor: 'bg-purple-100',
        color: 'text-violet-500',
        borderColor: 'border-purple-200',
        focus: 'focus:bg-purple-200 focus:text-purple-700',
      };
    case 'Unpublished':
      return {
        bgColor: 'bg-orange-50',
        color: 'text-orange-600',
        borderColor: 'border-orange-200',
        focus: 'focus:bg-orange-200 focus:text-orange-700',
      };
    default:
      return {
        bgColor: 'bg-gray-500',
        color: 'text-white',
        borderColor: 'border-gray-500',
        focus: 'focus:bg-gray-600 focus:text-gray-100',
      };
  }
};
