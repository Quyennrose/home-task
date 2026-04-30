const BOOKING_CHAT_STORAGE_KEY = 'hometask_booking_chat_messages';

export interface BookingChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

function readMessages(): BookingChatMessage[] {
  const rawMessages = localStorage.getItem(BOOKING_CHAT_STORAGE_KEY);
  if (!rawMessages) {
    return [];
  }

  try {
    const parsedMessages = JSON.parse(rawMessages);
    return Array.isArray(parsedMessages) ? parsedMessages : [];
  } catch {
    localStorage.removeItem(BOOKING_CHAT_STORAGE_KEY);
    return [];
  }
}

function writeMessages(messages: BookingChatMessage[]) {
  localStorage.setItem(BOOKING_CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function getBookingChatMessages(bookingId: string) {
  return readMessages()
    .filter((message) => message.bookingId === bookingId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function createBookingChatMessage(input: Omit<BookingChatMessage, 'id' | 'createdAt'>) {
  const message: BookingChatMessage = {
    ...input,
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  writeMessages([...readMessages(), message]);
  return message;
}
