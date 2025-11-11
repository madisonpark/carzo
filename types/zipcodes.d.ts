declare module 'zipcodes' {
  interface ZipCodeData {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  }

  function lookup(zip: string): ZipCodeData | undefined;
  function lookupByName(city: string, state: string): ZipCodeData[];
  function lookupByCoords(lat: number, lon: number, radius?: number): ZipCodeData[];
  function distance(zip1: string, zip2: string): number | null;
  function radius(zip: string, miles: number): string[];
  function toMiles(kilometers: number): number;
  function toKilometers(miles: number): number;

  export = {
    lookup,
    lookupByName,
    lookupByCoords,
    distance,
    radius,
    toMiles,
    toKilometers,
  };
}
