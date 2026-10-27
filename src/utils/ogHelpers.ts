const formatString = (str: string, maxLength: number) =>
  str?.length > maxLength ? `${str.slice(0, maxLength)}...` : str;

// Reads an OG query param, optionally transformed; null when the param is absent.
function createParamReader(params: {
  get(name: string): string | null | undefined;
}) {
  function getParam(name: string): string | null;
  function getParam<T>(name: string, processFn: (value: string) => T): T | null;
  function getParam<T>(name: string, processFn?: (value: string) => T) {
    const value = params.get(name);
    if (value == null) return null;
    return processFn ? processFn(value) : value;
  }
  return getParam;
}

const formatNumber = (num: string) => {
  const number = Number(num);

  if (isNaN(number)) {
    return '0';
  }

  if (number >= 1000000) {
    return `${(number / 1000000).toLocaleString('en-us', { maximumFractionDigits: 2 })}m`;
  } else if (number >= 10000) {
    return `${(number / 1000).toLocaleString('en-us', { maximumFractionDigits: 2 })}k`;
  } else {
    return number.toLocaleString('en-us', { maximumFractionDigits: 2 });
  }
};

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
  const cssResponse = await fetch(url);
  if (!cssResponse.ok) throw new Error('Failed to load font CSS');
  const css = await cssResponse.text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1] as string);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('Failed to load font data');
}

export { createParamReader, formatNumber, formatString, loadGoogleFont };
