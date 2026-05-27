import { CabinClass, Airport, Airline, FlightSegment, FlightOffer } from "@/types/flight";

export interface AirportSearchInput {
  query: string;
}

export interface AirportSearchResult extends Airport {}

export interface AirlineSearchInput {
  query: string;
}

export interface AirlineSearchResult extends Airline {}

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

export { type FlightOffer, type FlightSegment };
