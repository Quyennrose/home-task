import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { appConfig } from '@/app/config/appConfig';
import { Booking } from '@/app/data/mockData';
import { useAuth } from '@/app/contexts/AuthContext';
import { getApiErrorMessage } from '@/app/services/apiClient';
import { localApi } from '@/app/utils/localApi';
import type { BookingChatMessage } from '@/app/utils/bookingChatStorage';

interface BookingChatProps {
  booking: Booking;
}

export function BookingChat({ booking }: BookingChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');

    localApi.chat.listByBooking(booking.id)
      .then((nextMessages) => {
        if (active) {
          setMessages(nextMessages);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(getApiErrorMessage(nextError));
        }
      });

    return () => {
      active = false;
    };
  }, [booking.id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !user) {
      return;
    }

    setError('');

    try {
      const nextMessage = await localApi.chat.create({
        bookingId: booking.id,
        senderId: user.id,
        senderName: user.name,
        message: trimmedMessage,
      });

      const recipientId = user.id === booking.customerId ? booking.helperId : booking.customerId;
      if (recipientId) {
        await localApi.notifications.create({
          userId: recipientId,
          title: 'Tin nhan moi trong lich dat',
          message: `${user.name}: ${trimmedMessage}`,
        });
      }

      setMessages((currentMessages) => [...currentMessages, nextMessage]);
      setMessage('');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    }
  };

  return (
    <div className="bg-white rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-[#6366F1]" />
        <h4 className="font-semibold text-[#1A365D] text-sm">Trao doi ve lich nay</h4>
      </div>
      {!appConfig.capabilities.realtimeMessaging && (
        <p className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
          Tin nhan hien chua realtime. Cau hinh VITE_REALTIME_PROVIDER de bat dong bo tuc thi.
        </p>
      )}
      {error && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          {error}
        </p>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
        {messages.length > 0 ? messages.map((item) => {
          const isMine = item.senderId === user?.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl px-3 py-2 text-xs ${isMine ? 'bg-[#6366F1] text-white ml-8' : 'bg-[#F0F4F8] text-gray-700 mr-8'}`}
            >
              <p className={`font-semibold mb-1 ${isMine ? 'text-white' : 'text-[#1A365D]'}`}>{item.senderName}</p>
              <p>{item.message}</p>
            </div>
          );
        }) : (
          <p className="text-xs text-gray-500">Chua co tin nhan. Dung phan nay de trao doi nhanh voi ben con lai hoac admin.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Nhap tin nhan..."
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-[#6366F1] text-white rounded-xl"
          aria-label="Gui tin nhan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
