export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return { bgColor: '#D1FAE5', color: '#0D9488' };
    case 'Under Verification':
    case 'Fndn to Pay':
      return { bgColor: 'pink.100', color: 'pink.500' };
    case 'Payment Pending':
      return { bgColor: '#ffecb3', color: '#F59E0B' };
    case 'Verification Failed':
      return { bgColor: 'red.100', color: 'red.400' };
    case 'Draft':
      return { bgColor: 'brand.slate.100', color: 'brand.slate.400' };
    case 'In Review':
      return { bgColor: 'cyan.100', color: 'cyan.600' };
    case 'In Progress':
      return { bgColor: '#F3E8FF', color: '#8B5CF6' };
    case 'Ongoing':
      return { bgColor: '#F3E8FF', color: '#8B5CF6' };
    default:
      return { bgColor: 'gray', color: 'white' };
  }
};
