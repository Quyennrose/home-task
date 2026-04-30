import { Booking } from '@/app/data/mockData';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface BookingGeoCheck {
  target: GeoPoint;
  distanceMeters: number;
  withinAllowedRadius: boolean;
}

const DISTRICT_COORDINATES: Array<{ keyword: string; point: GeoPoint }> = [
  { keyword: 'hải châu', point: { latitude: 16.0544, longitude: 108.2022 } },
  { keyword: 'hai chau', point: { latitude: 16.0544, longitude: 108.2022 } },
  { keyword: 'thanh khê', point: { latitude: 16.0642, longitude: 108.1873 } },
  { keyword: 'thanh khe', point: { latitude: 16.0642, longitude: 108.1873 } },
  { keyword: 'sơn trà', point: { latitude: 16.1064, longitude: 108.2578 } },
  { keyword: 'son tra', point: { latitude: 16.1064, longitude: 108.2578 } },
  { keyword: 'cẩm lệ', point: { latitude: 16.0159, longitude: 108.2101 } },
  { keyword: 'cam le', point: { latitude: 16.0159, longitude: 108.2101 } },
];

const DEFAULT_DA_NANG_CENTER: GeoPoint = { latitude: 16.0678, longitude: 108.2208 };
const ALLOWED_RADIUS_METERS = 3000;

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export function calculateDistanceMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function estimateBookingTargetLocation(booking: Booking): GeoPoint {
  const normalizedAddress = booking.address.toLowerCase();
  const matchedDistrict = DISTRICT_COORDINATES.find((item) => normalizedAddress.includes(item.keyword));
  return matchedDistrict?.point ?? DEFAULT_DA_NANG_CENTER;
}

export function checkBookingDistance(booking: Booking, capturedLocation: GeoPoint): BookingGeoCheck {
  const target = estimateBookingTargetLocation(booking);
  const distanceMeters = calculateDistanceMeters(capturedLocation, target);

  return {
    target,
    distanceMeters,
    withinAllowedRadius: distanceMeters <= ALLOWED_RADIUS_METERS,
  };
}

export function formatDistance(distanceMeters?: number) {
  if (typeof distanceMeters !== 'number') {
    return 'Chưa kiểm tra';
  }

  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${distanceMeters} m`;
}
