import React, { useState } from 'react';
import { getSavedAuditLogs, AuditLogEntry } from '../utils/storage';
import { ShieldCheck, Clock, Search, RefreshCw, Download, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuditLogView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>(getSavedAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const handleRefresh = () => {
    setLogs(getSavedAuditLogs());
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `steer_audit_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportCsv = () => {
    const headers = ['id', 'timestamp', 'userName', 'userEmail', 'role', 'action', 'details'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `steer_audit_report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xs shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              SECURE GOVERNANCE
            </span>
            <span className="text-xs font-mono text-[#416C49] font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              100% Automated System Audit Trail
            </span>
          </div>
          <h2 className="font-serif text-lg font-bold text-[#351D1D] tracking-tight">
            Automated System-Wide Compliance & Review Logs
          </h2>
          <p className="text-xs text-[#786A61] leading-relaxed">
            Deterministic, tamper-proof tracking of every research intake, validation gate evaluation, editorial decision, and clinical generation. Manual entry disabled by policy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#E6CBBD] text-[#351D1D] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Refresh latest automated logs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#E6CBBD] text-[#351D1D] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#661414]" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Automated Policy Banner (Replacing manual form) */}
      <div className="bg-[#FAF6F0] border border-[#E6CBBD] p-4 rounded-xs shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#416C49]/15 flex items-center justify-center text-[#416C49] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-[#351D1D]">
              Automated Integrity Protocol Active
            </h4>
            <p className="text-[11px] text-[#786A61] leading-relaxed">
              All audit records are automatically emitted and cryptographically time-stamped by system actions. Manual event injection is prohibited to guarantee regulatory auditability.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-[#416C49] bg-[#416C49]/10 px-3 py-1.5 rounded-xs border border-[#416C49]/20 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{logs.length} Automated Events Captured</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDF9] p-4 border border-[#E6CBBD] rounded-xs shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#786A61] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search automated logs by user, action, provenance..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-[#786A61] font-semibold">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-[#FAF6F0] border border-[#E6CBBD] text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Medical Reviewer">Medical Reviewer</option>
            <option value="Content Creator">Content Creator</option>
            <option value="Compliance Officer">Compliance Officer</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Ledger Table */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6F0] border-b border-[#E6CBBD] text-[#351D1D] font-mono text-[10px] uppercase">
                <th className="p-3.5 font-bold">Timestamp</th>
                <th className="p-3.5 font-bold">Triggered By</th>
                <th className="p-3.5 font-bold">Action Category</th>
                <th className="p-3.5 font-bold">Details & Provenance Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6CBBD]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-[#786A61] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-[#351D1D]">{log.userName}</div>
                    <div className="text-[10px] font-mono text-[#786A61]">{log.userEmail}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#661414]/15 text-[#661414] text-[9px] font-mono font-bold rounded-xs uppercase">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-[#C04E2A] text-[11px]">
                    {log.action}
                  </td>
                  <td className="p-3.5 text-[#351D1D] leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-[#786A61] font-mono text-xs">
                    No automated audit events match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
