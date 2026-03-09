
export type City = {
    name: string;
    country: string;
    lat: number;
    lng: number;
};

export const MAJOR_CITIES: City[] = [
    { name: "Berlin", country: "DE", lat: 52.52, lng: 13.40 },
    { name: "München", country: "DE", lat: 48.13, lng: 11.58 },
    { name: "Hamburg", country: "DE", lat: 53.55, lng: 9.99 },
    { name: "Köln", country: "DE", lat: 50.93, lng: 6.96 },
    { name: "Frankfurt am Main", country: "DE", lat: 50.11, lng: 8.68 },
    { name: "Stuttgart", country: "DE", lat: 48.77, lng: 9.18 },
    { name: "Düsseldorf", country: "DE", lat: 51.22, lng: 6.77 },
    { name: "Leipzig", country: "DE", lat: 51.33, lng: 12.37 },
    { name: "Dortmund", country: "DE", lat: 51.51, lng: 7.46 },
    { name: "Essen", country: "DE", lat: 51.45, lng: 7.01 },
    { name: "Wien", country: "AT", lat: 48.20, lng: 16.37 },
    { name: "Zürich", country: "CH", lat: 47.37, lng: 8.54 },
    { name: "London", country: "UK", lat: 51.50, lng: -0.12 },
    { name: "New York", country: "US", lat: 40.71, lng: -74.00 },
    { name: "Paris", country: "FR", lat: 48.85, lng: 2.35 },
    { name: "Los Angeles", country: "US", lat: 34.05, lng: -118.24 },
    { name: "Tokyo", country: "JP", lat: 35.67, lng: 139.65 },
];
