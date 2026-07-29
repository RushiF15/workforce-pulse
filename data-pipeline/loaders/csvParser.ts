/**
 * Minimal RFC 4180 CSV parser.
 *
 * Why not `split(',')`: task categories and app names are free text and will
 * eventually contain commas ("Reporting, Weekly"). Why not a library: this is
 * ~60 lines, has no install cost, and runs unchanged in Node, edge and browser
 * runtimes. If the source ever grows past ~100k rows or gains exotic quoting,
 * swap in `papaparse` behind this same function signature.
 *
 * Handles: quoted fields, escaped quotes (""), embedded newlines,
 * CRLF and LF line endings, and a UTF-8 BOM.
 */

export interface CsvParseResult {
  headers: string[];
  /** One record per data row, keyed by header. */
  rows: Array<Record<string, string>>;
  /** Rows whose column count did not match the header. */
  malformedRowIndexes: number[];
}

function splitRecords(input: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      // Consume CRLF as a single terminator.
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Flush trailing field/record (file not ending in a newline).
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

export function parseCsv(input: string): CsvParseResult {
  const text = input.replace(/^\uFEFF/, ''); // strip BOM
  const records = splitRecords(text).filter(
    (record) => !(record.length === 1 && record[0].trim() === ''),
  );

  if (records.length === 0) {
    return { headers: [], rows: [], malformedRowIndexes: [] };
  }

  const headers = records[0].map((header) => header.trim());
  const rows: Array<Record<string, string>> = [];
  const malformedRowIndexes: number[] = [];

  for (let i = 1; i < records.length; i += 1) {
    const record = records[i];
    if (record.length !== headers.length) {
      malformedRowIndexes.push(i - 1);
      // Short rows are still salvageable — pad and keep. Long rows are not.
      if (record.length < headers.length) {
        while (record.length < headers.length) record.push('');
      } else {
        continue;
      }
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = record[index] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, malformedRowIndexes };
}
