import { FormEvent, useState } from 'react';
import { Shield, UserRound } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { HelperProfile } from '@/app/data/mockData';

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function HelperProfilePage() {
  const { user, updateUser } = useAuth();
  const helperProfile = user?.userType === 'helper' ? user as HelperProfile : null;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bio: helperProfile?.bio ?? '',
    skills: helperProfile?.skills?.join(', ') ?? '',
    availability: helperProfile?.availability?.join(', ') ?? '',
    serviceAreas: helperProfile?.serviceAreas?.join(', ') ?? '',
    bankName: helperProfile?.bankName ?? '',
    bankAccount: helperProfile?.bankAccount ?? '',
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await updateUser({
      bio: form.bio,
      skills: splitList(form.skills),
      availability: splitList(form.availability),
      serviceAreas: splitList(form.serviceAreas),
      bankName: form.bankName,
      bankAccount: form.bankAccount,
    });
    setSaved(true);
  };

  if (!helperProfile) {
    return null;
  }

  return (
    <section className="py-6 px-4 bg-white min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <UserRound className="w-3 h-3" />
          Hồ sơ người giúp việc
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Cập nhật hồ sơ làm việc</h1>
        <p className="text-gray-600 text-sm">
          Điều chỉnh kỹ năng, lịch làm, khu vực nhận việc và thông tin nhận thanh toán.
        </p>
      </div>

      <div className="bg-[#F0F4F8] rounded-2xl p-4 mb-5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-[#1A365D] text-sm">
            {helperProfile.verified ? 'Hồ sơ đã được xác minh' : 'Hồ sơ đang chờ duyệt'}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Thay đổi hồ sơ sẽ được lưu vào trình duyệt demo và đồng bộ với màn admin duyệt hồ sơ.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-[#1A365D] mb-1">Giới thiệu</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-[#1A365D] mb-1">Kỹ năng</span>
          <input
            value={form.skills}
            onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
          <span className="text-[11px] text-gray-500">Cách nhau bằng dấu phẩy.</span>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-[#1A365D] mb-1">Lịch có thể làm</span>
          <input
            value={form.availability}
            onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-[#1A365D] mb-1">Khu vực nhận việc</span>
          <input
            value={form.serviceAreas}
            onChange={(event) => setForm((current) => ({ ...current, serviceAreas: event.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-semibold text-[#1A365D] mb-1">Ngân hàng</span>
            <input
              value={form.bankName}
              onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-[#1A365D] mb-1">Số tài khoản</span>
            <input
              value={form.bankAccount}
              onChange={(event) => setForm((current) => ({ ...current, bankAccount: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </label>
        </div>

        {saved && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
            Đã lưu thay đổi hồ sơ.
          </p>
        )}

        <button
          type="submit"
          className="w-full px-4 py-3 bg-[#6366F1] text-white rounded-xl text-sm font-semibold"
        >
          Lưu hồ sơ
        </button>
      </form>
    </section>
  );
}
