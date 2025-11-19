/**
 * CSV utilities for safe export generation
 */

/**
 * Sanitize field for CSV export to prevent formula injection
 *
 * Protects against CSV injection attacks where malicious formulas could be executed
 * when opening CSV files in Excel, Google Sheets, etc.
 *
 * @param value - The value to sanitize
 * @returns Sanitized value wrapped in quotes
 *
 * @example
 * sanitizeCsvField('Hello') // => '"Hello"'
 * sanitizeCsvField('=SUM(A1:A10)') // => '"\'=SUM(A1:A10)"' (prefixed with single quote)
 * sanitizeCsvField('Line 1\nLine 2') // => '"Line 1 Line 2"' (newlines removed)
 */
export function sanitizeCsvField(value: string | number | null | undefined): string {
  // Handle null/undefined
  if (value == null) return '""';

  // Convert to string
  const stringValue = String(value);

  // Handle empty string
  if (!stringValue) return '""';

  // Prevent formula injection (leading =, +, -, @, tab, carriage return)
  let sanitized = stringValue;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`; // Prefix with single quote
  }

  // Escape double quotes
  sanitized = sanitized.replace(/"/g, '""');

  // Remove newlines (replace with space)
  sanitized = sanitized.replace(/[\r\n]/g, ' ');

  return `"${sanitized}"`;
}

/**
 * Generate CSV row from array of values
 *
 * @param values - Array of values to convert to CSV row
 * @returns CSV row string
 *
 * @example
 * csvRow(['Name', 'Age', 'City'])
 * // => '"Name","Age","City"'
 *
 * csvRow(['John', 25, 'New York'])
 * // => '"John","25","New York"'
 */
export function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map(sanitizeCsvField).join(',');
}

/**
 * Generate complete CSV from header and data rows
 *
 * @param header - Column headers
 * @param rows - Data rows (array of arrays)
 * @returns Complete CSV string
 *
 * @example
 * generateCsv(
 *   ['Name', 'Age'],
 *   [
 *     ['Alice', 30],
 *     ['Bob', 25]
 *   ]
 * )
 * // => '"Name","Age"\n"Alice","30"\n"Bob","25"'
 */
export function generateCsv(
  header: Array<string | number>,
  rows: Array<Array<string | number | null | undefined>>
): string {
  return [csvRow(header), ...rows.map(csvRow)].join('\n');
}
