export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Encodes a single number (delta * 1e5) using Google Polyline Algorithm
 */
const encodeNumber = (num: number): string => {
  let sgnNum = num << 1;
  if (num < 0) {
    sgnNum = ~sgnNum;
  }
  let encodeString = '';
  while (sgnNum >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  encodeString += String.fromCharCode(sgnNum + 63);
  return encodeString;
};

/**
 * Encodes an array of coordinates into a Google Encoded Polyline string.
 * Reduces 95% data size for network transmission & MySQL storage.
 */
export const encodePolyline = (coordinates: Coordinate[]): string => {
  if (!coordinates || coordinates.length === 0) {
    return '';
  }

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.latitude * 1e5);
    const lng = Math.round(coord.longitude * 1e5);

    const deltaLat = lat - prevLat;
    const deltaLng = lng - prevLng;

    encoded += encodeNumber(deltaLat);
    encoded += encodeNumber(deltaLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
};

/**
 * Decodes a Google Encoded Polyline string back into an array of coordinates.
 */
export const decodePolyline = (encoded: string): Coordinate[] => {
  if (!encoded) {
    return [];
  }

  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;

    // Decode Latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode Longitude
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
};
