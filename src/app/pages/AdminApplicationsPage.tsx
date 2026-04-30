import { useEffect, useState } from 'react';
import { CheckCircle, ClipboardCheck, Shield } from 'lucide-react';
import { HelperProfile } from '@/app/data/mockData';
import { getApiErrorMessage } from '@/app/services/apiClient';
import { localApi } from '@/app/utils/localApi';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<HelperProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshApplications = () => {
    setLoading(true);
    setError('');
    localApi.helperApplications.list()
      .then(setApplications)
      .catch((nextError) => setError(getApiErrorMessage(nextError)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshApplications();
  }, []);

  const handleStatusChange = async (helperId: string, status: HelperProfile['applicationStatus']) => {
    setError('');
    try {
      await localApi.helperApplications.updateStatus(helperId, status);
      await localApi.notifications.create({
        userId: helperId,
        title: status === 'approved' ? 'Hồ sơ đã được duyệt' : 'Hồ sơ bị từ chối',
        message: status === 'approved'
          ? 'Bạn đã có thể nhận lịch đặt mới trong HomeTask.'
          : 'Vui lòng kiểm tra lại thông tin và bổ sung hồ sơ nếu cần.',
      });
      refreshApplications();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    }
  };

  const pendingApplications = applications.filter((application) => application.applicationStatus === 'pending').length;

  return (
    <section className="py-6 px-4 bg-[#F0F4F8] min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <Shield className="w-3 h-3" />
          Quản trị
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Duyệt hồ sơ người giúp việc</h1>
        <p className="text-gray-600 text-sm">
          Kiểm tra thông tin ứng tuyển, khu vực nhận việc và giấy tờ xác minh trước khi mở nhận lịch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4">
          <ClipboardCheck className="w-5 h-5 text-[#6366F1] mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{pendingApplications}</div>
          <div className="text-xs text-gray-600">Hồ sơ chờ duyệt</div>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{applications.length}</div>
          <div className="text-xs text-gray-600">Tổng hồ sơ</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <p className="text-gray-600 text-sm">Đang tải hồ sơ...</p>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-[#1A365D] text-sm">{application.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{application.phone} - {application.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                  application.applicationStatus === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : application.applicationStatus === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {application.applicationStatus === 'approved'
                    ? 'Đã duyệt'
                    : application.applicationStatus === 'rejected'
                      ? 'Từ chối'
                      : 'Chờ duyệt'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-600 mb-4">
                <p>Kinh nghiệm: {application.experience}</p>
                <p>Khu vực: {application.serviceAreas?.join(', ') || application.location}</p>
                <p>Lịch làm: {application.availability?.join(', ')}</p>
                <p>Ngân hàng: {application.bankName || 'Chưa khai báo'} {application.bankAccount ? `- ${application.bankAccount}` : ''}</p>
                <p>Giấy tờ: {application.identityDocumentName || 'Chưa tải lên'}</p>
                {application.applicationNote && <p>Ghi chú: {application.applicationNote}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid={`admin-approve-${application.id}`}
                  onClick={() => handleStatusChange(application.id, 'approved')}
                  disabled={application.applicationStatus === 'approved'}
                  className="px-3 py-2 bg-green-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold"
                >
                  Duyệt hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(application.id, 'rejected')}
                  disabled={application.applicationStatus === 'rejected'}
                  className="px-3 py-2 bg-red-50 disabled:bg-gray-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A365D] mb-1">Chưa có hồ sơ ứng tuyển</h3>
          <p className="text-gray-600 text-sm">Khi người giúp việc nộp đơn, admin sẽ thấy hồ sơ tại đây.</p>
        </div>
      )}
    </section>
  );
}
