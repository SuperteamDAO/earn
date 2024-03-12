export const truncateString = (string: string = '', length: number) => {
  if (string.length > length) {
    return `${string.substring(0, length)}...`;
  } else {
    return string;
  }
};
