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

  async searchFlights(input: FlightSearchInput): Promise<FlightSearchResult> {
    // AviationStack doesn't provide price-based flight offers in the same way as Amadeus.
    console.warn("AviationStackProvider: searchFlights not fully implemented for booking offers.");
    return {
      offers: [],
    };
  }

  async getFlightOffer(id: string): Promise<FlightOffer> {
    throw new Error("Method not implemented.");
  }

  async priceFlightOffer(input: FlightPricingInput): Promise<FlightPricingResult> {
    throw new Error("Method not implemented.");
  }

  async checkAvailability(input: FlightAvailabilityInput): Promise<FlightAvailabilityResult> {
    throw new Error("Method not implemented.");
  }

  async searchAirlines(input: AirlineSearchInput): Promise<AirlineSearchResult[]> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      search: input.query,
    });

    const response = await fetch(`${this.baseUrl}/airlines?${params.toString()}`);
    const data = await response.json();

    return (data.data || []).map((airline: any) => ({
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

    if (!data.data || data.data.length === 0) {
      throw new Error("Flight status not found");
    }

    const flight = data.data[0];
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

    return (data.data || []).map((airport: any) => ({
      code: airport.iata_code,
      name: airport.airport_name,
      city: airport.city_iata_code,
      country: airport.country_name,
    }));
  }
}
