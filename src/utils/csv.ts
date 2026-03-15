type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return '';
  }

  const normalizedValue = String(value);
  const escapedValue = normalizedValue.replaceAll('"', '""');

  if (
    /[",\n\r]/.test(normalizedValue) ||
    normalizedValue.startsWith(' ') ||
    normalizedValue.endsWith(' ')
  ) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

export function serializeCsv(rows: Record<string, CsvValue>[]) {
  if (rows.length === 0) {
    return '';
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(','),
    ),
  ];

  return lines.join('\r\n');
}
