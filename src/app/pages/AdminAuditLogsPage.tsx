import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCcw, ShieldAlert } from 'lucide-react';
import { getApiErrorMessage } from '@/app/services/apiClient';
import { AuditLog, localApi } from '@/app/utils/localApi';

const actionOptions = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'booking.created', label: 'Tạo lịch' },
  { value: 'booking.status_updated', label: 'Đổi trạng thái lịch' },
  { value: 'booking.progress_updated', label: 'Cập nhật tiến độ' },
  { value: 'booking.payment_updated', label: 'Cập nhật thanh toán' },
  { value: 'helper_application.status_updated', label: 'Duyệt hồ sơ' },
  { value: 'review.created', label: 'Tạo đánh giá' },
  { value: 'payment.checkout_created', label: 'Tạo checkout' },
];

function formatAction(action: string) {
  return actionOptions.find((option) => option.value === action)?.label || action;
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata || {});
  if (entries.length === 0) {
    return 'Không có metadata';
  }

  return entries
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' | ');
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshLogs = () => {
    setLoading(true);
    setError('');
    localApi.admin.listAuditLogs({ action, limit: 100 })
      .then(setLogs)
      .catch((nextError) => setError(getApiErrorMessage(nextError)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshLogs();
  }, [action]);

  const actionCounts = useMemo(() => logs.reduce<Record<string, number>>((counts, log) => {
    counts[log.action] = (counts[log.action] || 0) + 1;
    return counts;
  }, {}), [logs]);

  return (
    <section className="py-6 px-4 bg-[#F0F4F8] min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <Activity className="w-3 h-3" />
          Audit log
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Nhật ký vận hành</h1>
        <p className="text-gray-600 text-sm">
          Theo dõi các thay đổi quan trọng như tạo lịch, đổi trạng thái, GPS/checklist, thanh toán và duyệt hồ sơ.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4">
          <Activity className="w-5 h-5 text-[#6366F1] mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{logs.length}</div>
          <div className="text-xs text-gray-600">Dòng log đang xem</div>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{Object.keys(actionCounts).length}</div>
          <div className="text-xs text-gray-600">Loại hành động</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-[#1A365D] mb-1">Lọc theo hành động</label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="min-w-0 px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={refreshLogs}
            aria-label="Tải lại nhật ký"
            className="px-3 py-2 bg-[#6366F1] text-white rounded-xl text-xs font-semibold flex items-center justify-center"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <p className="text-gray-600 text-sm">Đang tải nhật ký...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="font-semibold text-[#1A365D] text-sm">{formatAction(log.action)}</h2>
                  <p className="text-xs text-gray-600 mt-1">{log.actorName} - {log.actorType}</p>
                </div>
                <span className="px-2.5 py-1 bg-[#F0F4F8] text-[#1A365D] rounded-full text-[10px] font-semibold whitespace-nowrap">
                  {log.targetType}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Tạo lúc: {new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                <p>Target: {log.targetId}</p>
                <p className="break-words">Metadata: {formatMetadata(log.metadata)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <Activity className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A365D] mb-1">Chưa có audit log</h3>
          <p className="text-gray-600 text-sm">Các thay đổi vận hành quan trọng sẽ xuất hiện ở đây.</p>
        </div>
      )}
    </section>
  );
}
