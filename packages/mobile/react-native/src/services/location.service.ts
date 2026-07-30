import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

class LocationService {
  private watchId: number | null = null;

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Al Mokhtabar needs access to your location to find nearby branches',
          buttonPositive: 'Grant',
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Later',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  watchPosition(
    callback: (coords: Coordinates) => void,
    onError?: (error: Error) => void,
  ): void {
    this.watchId = Geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (onError) onError(new Error(error.message));
      },
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 },
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const results = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
      ).then((r) => r.json());
      if (results.results?.length > 0) {
        const { lat, lng } = results.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      }
      return null;
    } catch {
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    try {
      const results = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
      ).then((r) => r.json());
      if (results.results?.length > 0) {
        const addr = results.results[0];
        const components = addr.address_components || [];
        const getType = (type: string) =>
          components.find((c: { types: string[] }) => c.types.includes(type))
            ?.long_name || '';
        return {
          street: getType('route') || addr.formatted_address,
          city: getType('locality'),
          state: getType('administrative_area_level_1'),
          country: getType('country'),
          postalCode: getType('postal_code'),
          formattedAddress: addr.formatted_address,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const locationService = new LocationService();
