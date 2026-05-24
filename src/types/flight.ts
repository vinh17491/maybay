export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
  logoUrl?: string;
}

export interface FlightSegment {
  id: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  airline: Airline;
  flightNumber: string;
  aircraft: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  price: {
    amount: number;
    currency: string;
  };
  cabinClass: CabinClass;
  availableSeats: number;
  isRefundable: boolean;
  baggageAllowance: string;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  cabinClass: CabinClass;
}
