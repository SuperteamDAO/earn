const fetchAsset = (url: URL) => fetch(url).then((res) => res.arrayBuffer());

const formatString = (str: string, maxLength: number) =>
  str?.length > maxLength ? `${str.slice(0, maxLength)}...` : str;

const formatNumber = (num: string) =>
  Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 });

export { fetchAsset, formatNumber, formatString };
