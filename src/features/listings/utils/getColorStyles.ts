export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return { bgColor: 'bg-emerald-100', color: 'text-teal-600' };
    case 'Under Verification':
    case 'Fndn to Pay':
      return { bgColor: 'bg-pink-100', color: 'text-pink-500' };
    case 'Payment Pending':
      return { bgColor: 'bg-[#ffecb3]', color: 'text-amber-500' };
    case 'Verification Failed':
      return { bgColor: 'bg-red-100', color: 'text-red-400' };
    case 'Draft':
      return { bgColor: 'bg-slate-100', color: 'text-slate-400' };
    case 'In Review':
      return { bgColor: 'bg-cyan-100', color: 'text-cyan-600' };
    case 'In Progress':
      return { bgColor: 'bg-purple-100', color: 'text-violet-500' };
    case 'Ongoing':
      return { bgColor: 'bg-purple-100', color: 'text-violet-500' };
    default:
      return { bgColor: 'bg-gray-500', color: 'text-white' };
  }
};
