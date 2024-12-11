export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return { bgColor: 'bg-[#D1FAE5]', color: 'text-[#0D9488]' };
    case 'Under Verification':
    case 'Fndn to Pay':
      return { bgColor: 'bg-pink-100', color: 'text-pink-500' };
    case 'Payment Pending':
      return { bgColor: 'bg-[#ffecb3]', color: 'text-[#F59E0B]' };
    case 'Verification Failed':
      return { bgColor: 'bg-red-100', color: 'text-red-400' };
    case 'Draft':
      return { bgColor: 'bg-slate-100', color: 'text-slate-400' };
    case 'In Review':
      return { bgColor: 'bg-cyan-100', color: 'text-cyan-600' };
    case 'In Progress':
      return { bgColor: 'bg-[#F3E8FF]', color: 'text-[#8B5CF6]' };
    case 'Ongoing':
      return { bgColor: 'bg-[#F3E8FF]', color: 'text-[#8B5CF6]' };
    default:
      return { bgColor: 'bg-gray-500', color: 'text-white' };
  }
};
