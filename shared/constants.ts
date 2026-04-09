export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed"
}

export enum AIIntent {
  FAQ = "faq",
  BOOKING = "booking",
  CHITCHAT = "chitchat",
  UNKNOWN = "unknown"
}

export interface Booking {
  id: string;
  merchantId: string;
  customerName: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
