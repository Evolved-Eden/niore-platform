'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

export default function BulkImportPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data.filter((r: any) => r.agent_id && r.agent_name);
        setPreview(results.data.slice(0, 10));
        setStats({
          total: results.data.length,
          valid: rows.length,
          invalid: results.data.filter((r: any) => !r.agent_id || !r.agent_name).length,
        });
      },
    });
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const response = await fetch('/api/admin/agents/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: preview }),
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      alert(`Imported ${result.imported} agents successfully!`);
      router.push('/dashboard/admin/agents');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Bulk Import Agents</h1>
        <p className="text-white/40 text-sm mt-1">Import agents from CSV file</p>
      </div>

      {/* Download Template */}
      <div className="glass rounded-sm p-4 border border-white/[0.06]">
        <h3 className="font-bold text-blue-400 mb-2">Download Template</h3>
        <p className="text-sm text-blue-300 mb-2">Download the CSV template with required columns:</p>
        <a
          href="/api/admin/agents/bulk-import"
          className="text-blue-400 underline"
        >
          Download CSV Template
        </a>
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-white/[0.1] rounded-sm p-8 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="mx-auto text-white/70"
        />
        <p className="text-white/40 mt-2">Upload CSV file</p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-sm p-4 text-center border border-white/[0.06]">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/40">Total Rows</div>
          </div>
          <div className="glass rounded-sm p-4 text-center border border-white/[0.06]">
            <div className="text-2xl font-bold text-green-400">{stats.valid}</div>
            <div className="text-sm text-green-400/70">Valid</div>
          </div>
          <div className="glass rounded-sm p-4 text-center border border-white/[0.06]">
            <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
            <div className="text-sm text-red-400/70">Invalid</div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="glass rounded-sm overflow-hidden border border-white/[0.06]">
          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
            <h3 className="font-bold text-sm text-white/80">Preview (First 10 rows)</h3>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {Object.keys(preview[0]).slice(0, 6).map(key => (
                  <th key={key} className="px-4 py-2 text-left text-white/30 tracking-widest uppercase font-normal text-xs">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  {Object.values(row).slice(0, 6).map((val: any, j) => (
                    <td key={j} className="px-4 py-2 text-sm text-white/70">{String(val ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Button */}
      {stats.valid > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="px-4 py-2 text-sm font-medium bg-[#c8ff00] text-black rounded-sm hover:bg-white transition-colors font-bold w-full"
        >
          {importing ? 'Importing...' : `Import ${stats.valid} Agents`}
        </button>
      )}
    </div>
  );
}
