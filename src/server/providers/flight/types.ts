import { CabinClass } from "@prisma/client";

export interface AirportSearchInput {
  query: string;
}

export interface AirportSearchResult {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface AirlineSearchInput {
  query: string;
}

export interface AirlineSearchResult {
  code: string;
  name: string;
  logoUrl?: string;
}

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: CabinClass;
}

export interface FlightSearchResult {
  offers: FlightOffer[];
}

export interface FlightOffer {
  id: string;
  airline: AirlineSearchResult;
  segments: FlightSegmentDTO[];
  price: {
    amount: number;
    currency: string;
  };
  cabinClass: CabinClass;
  availableSeats: number;
}

export interface FlightSegmentDTO {
  id: string;
  departure: {
    airport: string;
    time: Date;
  };
  arrival: {
    airport: string;
    time: Date;
  };
  duration: number;
  flightNumber: string;
  aircraft: string;
}

export interface FlightPricingInput {
  offerId: string;
}

export interface FlightPricingResult {
  offer: FlightOffer;
  rules?: string;
}

export interface FlightAvailabilityInput {
  offerId: string;
}

export interface FlightAvailabilityResult {
  isAvailable: boolean;
  remainingSeats: number;
}

export interface FlightStatusInput {
  flightNumber: string;
  date: Date;
}

export interface FlightStatusResult {
  status: string;
  departure: Date;
  arrival: Date;
}

export interface FlightProvider {
  searchAirports(input: AirportSearchInput): Promise<AirportSearchResult[]>;
  searchAirlines(input: AirlineSearchInput): Promise<AirlineSearchResult[]>;
  searchFlights(input: FlightSearchInput): Promise<FlightSearchResult>;
  getFlightOffer(id: string): Promise<FlightOffer>;
  priceFlightOffer(input: FlightPricingInput): Promise<FlightPricingResult>;
  checkAvailability(input: FlightAvailabilityInput): Promise<FlightAvailabilityResult>;
  getFlightStatus(input: FlightStatusInput): Promise<FlightStatusResult>;
}
