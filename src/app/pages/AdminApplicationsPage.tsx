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
        title: status === 'approved' ? 'Ho so da duoc duyet' : 'Ho so bi tu choi',
        message: status === 'approved'
          ? 'Ban da co the nhan lich dat moi trong HomeTask.'
          : 'Vui long kiem tra lai thong tin va bo sung ho so neu can.',
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
          Quan tri
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Duyet ho so nguoi giup viec</h1>
        <p className="text-gray-600 text-sm">
          Kiem tra thong tin ung tuyen, khu vuc nhan viec va giay to xac minh truoc khi mo nhan lich.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4">
          <ClipboardCheck className="w-5 h-5 text-[#6366F1] mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{pendingApplications}</div>
          <div className="text-xs text-gray-600">Ho so cho duyet</div>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-[#1A365D]">{applications.length}</div>
          <div className="text-xs text-gray-600">Tong ho so</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <p className="text-gray-600 text-sm">Dang tai ho so...</p>
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
                    ? 'Da duyet'
                    : application.applicationStatus === 'rejected'
                      ? 'Tu choi'
                      : 'Cho duyet'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-600 mb-4">
                <p>Kinh nghiem: {application.experience}</p>
                <p>Khu vuc: {application.serviceAreas?.join(', ') || application.location}</p>
                <p>Lich lam: {application.availability?.join(', ')}</p>
                <p>Ngan hang: {application.bankName || 'Chua khai bao'} {application.bankAccount ? `- ${application.bankAccount}` : ''}</p>
                <p>Giay to: {application.identityDocumentName || 'Chua tai len'}</p>
                {application.applicationNote && <p>Ghi chu: {application.applicationNote}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(application.id, 'approved')}
                  disabled={application.applicationStatus === 'approved'}
                  className="px-3 py-2 bg-green-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold"
                >
                  Duyet ho so
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(application.id, 'rejected')}
                  disabled={application.applicationStatus === 'rejected'}
                  className="px-3 py-2 bg-red-50 disabled:bg-gray-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold"
                >
                  Tu choi
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A365D] mb-1">Chua co ho so ung tuyen</h3>
          <p className="text-gray-600 text-sm">Khi nguoi giup viec nop don, admin se thay ho so tai day.</p>
        </div>
      )}
    </section>
  );
}
