import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const csvText = readFileSync(join(__dirname, '..', 'evolved_eden_400_agents.csv'), 'utf8');
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let inBrackets = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (!inQuotes) {
      if (char === '[') inBrackets = true;
      if (char === ']') inBrackets = false;
    }
    if (char === ',' && !inQuotes && !inBrackets) { fields.push(current); current = ''; continue; }
    current += char;
  }
  fields.push(current);
  return fields;
}
const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
const header = parseCsvLine(lines[0]);
console.log('header count', header.length, header);
for (let idx = 1; idx < Math.min(lines.length, 50); idx += 1) {
  const fields = parseCsvLine(lines[idx]);
  if (fields.length === header.length - 1 && fields[12]?.startsWith('[')) {
    fields.splice(12, 0, '');
  }
  if (fields.length !== header.length) {
    console.log('mismatch at row', idx+1, 'count', fields.length, 'line:', lines[idx]);
    console.log(fields);
    break;
  }
}
console.log('done');
