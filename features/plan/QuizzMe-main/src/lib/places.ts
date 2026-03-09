export interface PlaceOption {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
}

export const MAJOR_CITIES: PlaceOption[] = [
  { name: 'Berlin', country: 'DE', lat: 52.5200, lng: 13.4050, tz: 'Europe/Berlin' },
  { name: 'Munich', country: 'DE', lat: 48.1351, lng: 11.5820, tz: 'Europe/Berlin' },
  { name: 'Hamburg', country: 'DE', lat: 53.5511, lng: 9.9937, tz: 'Europe/Berlin' },
  { name: 'Frankfurt', country: 'DE', lat: 50.1109, lng: 8.6821, tz: 'Europe/Berlin' },
  { name: 'Cologne', country: 'DE', lat: 50.9375, lng: 6.9603, tz: 'Europe/Berlin' },
  { name: 'Vienna', country: 'AT', lat: 48.2082, lng: 16.3738, tz: 'Europe/Vienna' },
  { name: 'Zurich', country: 'CH', lat: 47.3769, lng: 8.5417, tz: 'Europe/Zurich' },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  { name: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  { name: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
  { name: 'Los Angeles', country: 'US', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
];
