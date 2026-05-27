import { 
  FlightProvider, 
  FlightSearchInput, 
  FlightSearchResult, 
  FlightOffer, 
  FlightStatusInput, 
  FlightStatusResult,
  AirportSearchInput,
  AirportSearchResult,
  AirlineSearchInput,
  AirlineSearchResult,
  FlightPricingInput,
  FlightPricingResult,
  FlightAvailabilityInput,
  FlightAvailabilityResult
} from "./types";

/**
 * AviationStack API Provider Implementation
 * Note: AviationStack is primarily used for real-time flight status and historical data.
 * For flight offers/booking, Amadeus is the primary provider.
 */
export class AviationStackProvider implements FlightProvider {
  private apiKey: string;
  private baseUrl = "http://api.aviationstack.com/v1";

  constructor() {
    this.apiKey = process.env.AVIATION_STACK_API_KEY || "";
  }

  async searchFlights(_: FlightSearchInput): Promise<FlightSearchResult> {
    // AviationStack doesn't provide price-based flight offers in the same way as Amadeus.
    console.warn("AviationStackProvider: searchFlights not fully implemented for booking offers.");
    return {
      offers: [],
    };
  }

  async getFlightOffer(_: string): Promise<FlightOffer> {
    throw new Error("Method not implemented.");
  }

  async priceFlightOffer(_: FlightPricingInput): Promise<FlightPricingResult> {
    throw new Error("Method not implemented.");
  }

  async checkAvailability(_: FlightAvailabilityInput): Promise<FlightAvailabilityResult> {
    throw new Error("Method not implemented.");
  }

  async searchAirlines(input: AirlineSearchInput): Promise<AirlineSearchResult[]> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      search: input.query,
    });

    const response = await fetch(`${this.baseUrl}/airlines?${params.toString()}`);
    const data = await response.json();

    interface AviationStackAirline {
      iata_code: string;
      airline_name: string;
    }

    return (data.data as AviationStackAirline[] || []).map((airline) => ({
      code: airline.iata_code,
      name: airline.airline_name,
    }));
  }

  async getFlightStatus(input: FlightStatusInput): Promise<FlightStatusResult> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      flight_iata: input.flightNumber,
    });

    const response = await fetch(`${this.baseUrl}/flights?${params.toString()}`);
    const data = await response.json();

    interface AviationStackFlight {
      flight_status: string;
      departure: {
        scheduled: string;
      };
      arrival: {
        scheduled: string;
      };
    }

    if (!data.data || data.data.length === 0) {
      throw new Error("Flight status not found");
    }

    const flight = data.data[0] as AviationStackFlight;
    return {
      status: flight.flight_status.toUpperCase(),
      departure: new Date(flight.departure.scheduled),
      arrival: new Date(flight.arrival.scheduled),
    };
  }

  async searchAirports(input: AirportSearchInput): Promise<AirportSearchResult[]> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      search: input.query,
    });

    const response = await fetch(`${this.baseUrl}/airports?${params.toString()}`);
    const data = await response.json();

    interface AviationStackAirport {
      iata_code: string;
      airport_name: string;
      city_iata_code: string;
      country_name: string;
    }

    return (data.data as AviationStackAirport[] || []).map((airport) => ({
      code: airport.iata_code,
      name: airport.airport_name,
      city: airport.city_iata_code,
      country: airport.country_name,
    }));
  }
}
