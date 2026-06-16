import fs from 'fs';
const text = fs.readFileSync(new URL('../evolved_eden_400_agents.csv', import.meta.url), 'utf8');
function parse(line) {
  const f = [];
  let cur = '';
  let q = false;
  let b = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        q = !q;
      }
      continue;
    }
    if (!q) {
      if (ch === '[') b = true;
      else if (ch === ']') b = false;
    }
    if (ch === ',' && !q && !b) {
      f.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  f.push(cur);
  return f;
}
const lines = text.split(/\r?\n/).filter((line) => line.trim());
const header = parse(lines[0]);
console.log('header len', header.length);
let badCount = 0;
for (let i = 1; i < lines.length; i += 1) {
  const parsed = parse(lines[i]);
  if (parsed.length !== header.length) {
    badCount += 1;
    if (badCount <= 20) {
      console.log('bad', i + 1, parsed.length, lines[i]);
      console.log(parsed);
    }
  }
}
console.log('bad count', badCount);
