const fetchAsset = (url: URL) => fetch(url).then((res) => res.arrayBuffer());

const formatString = (str: string, maxLength: number) =>
  str?.length > maxLength ? `${str.slice(0, maxLength)}...` : str;

const formatNumber = (num: string) => {
  const number = Number(num);

  if (number >= 1000000) {
    return `${(number / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}m`;
  } else if (number >= 10000) {
    return `${(number / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}k`;
  } else {
    return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
};

export { fetchAsset, formatNumber, formatString };
