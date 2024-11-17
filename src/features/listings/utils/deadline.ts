import dayjs from 'dayjs';

export const formatDeadline = (
  deadline: string | undefined,
  type: string | undefined,
) => {
  if (type === 'grant') {
    return 'Ongoing';
  }
  return deadline ? dayjs(deadline).format("DD MMM'YY h:mm A") : '-';
};

export const isDeadlineOver = (deadline: string | Date | undefined) =>
  deadline ? dayjs().isAfter(dayjs(deadline)) : false;
