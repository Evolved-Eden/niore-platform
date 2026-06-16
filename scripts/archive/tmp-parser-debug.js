import fs from 'fs';
const lines = fs.readFileSync(new URL('../evolved_eden_400_agents.csv', import.meta.url), 'utf8').split(/\r?\n/).filter((line) => line.trim() !== '');
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let inBrackets = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (char === '[') {
        inBrackets = true;
      } else if (char === ']') {
        inBrackets = false;
      }
    }
    if (char === ',' && !inQuotes && !inBrackets) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}
const rowIndex = 180; // zero-based file line index for row 181
const line = lines[rowIndex];
const fields = parseCsvLine(line);
console.log('raw line index', rowIndex, 'row', rowIndex + 1);
console.log(line);
console.log('count', fields.length);
fields.forEach((field, idx) => console.log(idx, JSON.stringify(field)));
