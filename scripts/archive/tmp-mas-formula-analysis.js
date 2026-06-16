import fs from 'fs';
const text = fs.readFileSync(new URL('../evolved_eden_400_agents.csv', import.meta.url), 'utf8');
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  let inBrackets = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (char === '[') inBrackets = true;
      else if (char === ']') inBrackets = false;
    }
    if (char === ',' && !inQuotes && !inBrackets) {
      fields.push(cur);
      cur = '';
      continue;
    }
    cur += char;
  }
  fields.push(cur);
  return fields;
}
const lines = text.split(/\r?\n/).filter((line) => line.trim());
const header = parseCsvLine(lines[0]);
function normalizeFields(fields, headerLength) {
  if (fields.length === headerLength - 1 && fields[12]?.startsWith('[')) {
    fields.splice(12, 0, '');
  }
  if (fields.length === headerLength - 2 && fields[11]?.startsWith('[')) {
    fields.splice(8, 0, '', '');
  }
  return fields;
}
const rows = lines.slice(1).map((line) => {
  const f = normalizeFields(parseCsvLine(line), header.length);
  const obj = {};
  header.forEach((k, i) => { obj[k] = f[i] ?? ''; });
  return obj;
});
const data = rows.map((r) => ({ cap: +r.Capability, trust: +r.Trust, activation: +r.Activation, synergy: +r.Synergy, evolution: +r.Evolution, risk: +r.Risk, mas: +r.MAS })).filter((o) => !Number.isNaN(o.mas));
console.log('rows', data.length);
const formulas = [
  { name: 'migrationSchema', weights: { cap: 0.25, trust: 0.2, synergy: 0.2, activation: 0.15, evolution: 0.1, risk: -0.1, constant: 0 } },
  { name: 'posRiskSchema', weights: { cap: 0.25, trust: 0.2, synergy: 0.2, activation: 0.15, evolution: 0.1, risk: 0.1, constant: 0 } },
  { name: 'posRiskActSySwap', weights: { cap: 0.25, trust: 0.2, synergy: 0.15, activation: 0.2, evolution: 0.1, risk: 0.1, constant: 0 } },
  { name: 'posRiskCap27', weights: { cap: 0.27, trust: 0.2, synergy: 0.2, activation: 0.15, evolution: 0.1, risk: 0.1, constant: 0 } },
  { name: 'posRiskCap27Act20', weights: { cap: 0.27, trust: 0.2, synergy: 0.15, activation: 0.2, evolution: 0.1, risk: 0.1, constant: 0 } },
];
for (const f of formulas) {
  const diffs = data.map((o) => {
    const x =
      o.cap * f.weights.cap +
      o.trust * f.weights.trust +
      o.synergy * f.weights.synergy +
      o.activation * f.weights.activation +
      o.evolution * f.weights.evolution +
      o.risk * f.weights.risk +
      (f.weights.constant || 0);
    return { x, diff: x - o.mas, row: o };
  });
  const avg = diffs.reduce((s, o) => s + o.diff, 0) / diffs.length;
  const avgAbs = diffs.reduce((s, o) => s + Math.abs(o.diff), 0) / diffs.length;
  console.log(f.name, 'avg', avg.toFixed(4), 'abs', avgAbs.toFixed(4));
  if (f.name === 'migrationSchema' || f.name === 'posRiskSchema') {
    console.log(`Sample ${f.name} mismatches:`);
    diffs.filter((o) => Math.abs(o.diff) > 0.1).slice(0, 20).forEach((o, idx) => {
      console.log(idx, o.row.cap, o.row.trust, o.row.activation, o.row.synergy, o.row.evolution, o.row.risk, o.row.mas, o.x.toFixed(2), o.diff.toFixed(2));
    });
    console.log(`Sample ${f.name} first rows:`);
    data.slice(0, 10).forEach((o, idx) => {
      const x =
        o.cap * f.weights.cap +
        o.trust * f.weights.trust +
        o.synergy * f.weights.synergy +
        o.activation * f.weights.activation +
        o.evolution * f.weights.evolution +
        o.risk * f.weights.risk +
        (f.weights.constant || 0);
      console.log(idx, o.cap, o.trust, o.activation, o.synergy, o.evolution, o.risk, o.mas, x.toFixed(2), (x - o.mas).toFixed(2));
    });
  }
}
const X = data.map((o) => [o.cap, o.trust, o.activation, o.synergy, o.evolution, o.risk, 1]);
const y = data.map((o) => o.mas);
const m = X.length; const n = 7;
const XT = Array.from({ length: n }, () => Array(n).fill(0));
const XTy = Array(n).fill(0);
for (let i = 0; i < m; i += 1) {
  for (let j = 0; j < n; j += 1) {
    for (let k = 0; k < n; k += 1) {
      XT[j][k] += X[i][j] * X[i][k];
    }
    XTy[j] += X[i][j] * y[i];
  }
}
const A = XT.map((r) => [...r, 0]);
for (let i = 0; i < n; i += 1) A[i][n] = XTy[i];
for (let i = 0; i < n; i += 1) {
  let piv = i;
  for (let k = i + 1; k < n; k += 1) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
  [A[i], A[piv]] = [A[piv], A[i]];
  const div = A[i][i];
  if (Math.abs(div) < 1e-12) continue;
  for (let k = i; k <= n; k += 1) A[i][k] /= div;
  for (let r = 0; r < n; r += 1) {
    if (r === i) continue;
    const fac = A[r][i];
    for (let k = i; k <= n; k += 1) A[r][k] -= fac * A[i][k];
  }
}
const w = A.map((r) => r[n]);
console.log('weights', w.map((x) => Number(x.toFixed(6))));
for (let i = 0; i < 20; i += 1) {
  const o = data[i];
  const calc = o.cap * w[0] + o.trust * w[1] + o.act * w[2] + o.sy * w[3] + o.ev * w[4] + o.risk * w[5] + w[6];
  console.log(i, o.mas, calc.toFixed(4), (calc - o.mas).toFixed(4));
}
