#!/usr/bin/env node
/**
 * Seed Pipeline — single entry point for all seed/fix scripts.
 * Usage:  node scripts/seed.mjs [password] [--skip-audit]
 *

 * --skip-audit: skip the final launch audit report
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRIPTS_DIR = __dirname;
const args = process.argv.slice(2);
const SKIP_AUDIT = args.includes('--skip-audit');
const PW = args.find(a => !a.startsWith('--')) ;

const pipeline = [
  // ── Phase 1: Agent data fixes ──
  { name: 'Batch Fix Data (phase 1)', file: 'batch-fix-data.mjs', args: [PW],
    desc: 'Activate agent types, wire to clients & templates, fill vertical_subs, set swarm strategies' },
  { name: 'Batch Fix Data (phase 2)', file: 'batch-fix-data-2.mjs', args: [PW],
    desc: 'Template wiring, fill remaining fields' },
  { name: 'Merge Specialties',     file: 'merge-specialties.mjs',   args: [PW],
    desc: 'Merge vertical_subs into specialties column' },
  { name: 'Fix Swarm Members',     file: 'fix-swarm-members-v2.mjs', args: [PW],
    desc: 'Dedup + populate agent_swarm_members table' },
  { name: 'Finalize Capabilities', file: 'capabilities-finalize.mjs', args: [PW],
    desc: 'Link remaining agent_capabilities records' },

  // ── Phase 2: Builder system ──
  { name: 'Builder System v3',  file: 'setup-builder-system-v3.mjs', args: [PW],
    desc: 'Fix constraint, add affiliate tiers, addons, sync Stripe subscriptions' },
];

function runScript({ name, file, args, desc }) {
  const start = Date.now();
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ▶ ${name}`);
  console.log(`  ${desc}`);
  console.log(`${'═'.repeat(60)}\n`);

  try {
    execSync(`node "${path.join(SCRIPTS_DIR, file)}" ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd: path.resolve(SCRIPTS_DIR, '..'),
      timeout: 120000,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n  ✓ ${name} — completed in ${elapsed}s\n`);
    return true;
  } catch (err) {
    console.error(`\n  ✗ ${name} FAILED after ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.error(`  ${err.message.split('\n')[0]}`);
    return false;
  }
}

console.log(`\n${'█'.repeat(60)}`);
console.log('  SEED PIPELINE');
console.log(`${'█'.repeat(60)}\n`);

const results = [];
for (const step of pipeline) {
  const ok = runScript(step);
  results.push({ ...step, ok });
  if (!ok) {
    console.error(`\n  ✗ Pipeline halted at "${step.name}". Fix and re-run.`);
    break;
  }
}

// ── Audit ──
if (SKIP_AUDIT) {
  console.log('\n  --skip-audit: skipping launch audit');
} else {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  ▶ Launch Audit');
  console.log(`${'═'.repeat(60)}\n`);
  try {
    execSync(`node "${path.join(SCRIPTS_DIR, 'launch-audit.mjs')}" ${PW}`, {
      stdio: 'inherit',
      cwd: path.resolve(SCRIPTS_DIR, '..'),
      timeout: 60000,
    });
    console.log('\n  ✓ Launch audit complete');
  } catch (e) {
    console.error(`\n  ⚠ Audit non-critical: ${e.message.split('\n')[0]}`);
  }
}

// ── Summary ──
console.log(`\n${'█'.repeat(60)}`);
console.log('  SEED PIPELINE SUMMARY');
console.log(`${'█'.repeat(60)}\n`);

let passed = 0, failed = 0;
for (const r of results) {
  const icon = r.ok ? '✓' : '✗';
  console.log(`  ${icon} ${r.name}`);
  if (r.ok) passed++; else failed++;
}
console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed === 0) console.log('  ✓ All seed phases complete!');
else console.log('  ⚠ Some phases failed — review output above.');
