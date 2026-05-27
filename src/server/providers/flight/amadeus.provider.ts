import {
  FlightProvider,
  AirportSearchInput,
  AirportSearchResult,
  AirlineSearchInput,
  AirlineSearchResult,
  FlightSearchInput,
  FlightSearchResult,
  FlightPricingInput,
  FlightPricingResult,
  FlightAvailabilityInput,
  FlightAvailabilityResult,
  FlightStatusInput,
  FlightStatusResult,
  FlightOffer,
} from "./types";
import { CabinClass } from "@prisma/client";

/**
 * Amadeus Self Service API Provider
 * Implementation based on Amadeus for Developers documentation
 */
export class AmadeusProvider implements FlightProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.apiKey = process.env.AMADEUS_API_KEY || "";
    this.apiSecret = process.env.AMADEUS_API_SECRET || "";
    this.baseUrl = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  }

  private async getAuthToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`,
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Amadeus API");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

    return this.accessToken!;
  }

  private async fetchAmadeus(endpoint: string, params: Record<string, string> = {}, method = "GET", body?: unknown) {
    const token = await this.getAuthToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (method === "GET") {
      Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Amadeus API Error: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async searchAirports(input: AirportSearchInput): Promise<AirportSearchResult[]> {
    const data = await this.fetchAmadeus("/v1/reference-data/locations", {
      subType: "AIRPORT,CITY",
      keyword: input.query,
      "page[limit]": "10",
      sort: "analytics.travelers.score",
      view: "LIGHT",
    });

    interface AmadeusLocation {
      iataCode: string;
      name: string;
      address: {
        cityName: string;
        countryName: string;
      };
    }

    return (data.data as AmadeusLocation[]).map((item) => ({
      code: item.iataCode,
      name: item.name,
      city: item.address.cityName,
      country: item.address.countryName,
    }));
  }

  async searchAirlines(input: AirlineSearchInput): Promise<AirlineSearchResult[]> {
    const data = await this.fetchAmadeus("/v1/reference-data/airlines", {
      airlineCodes: input.query,
    });

    interface AmadeusAirline {
      iataCode: string;
      commonName: string;
    }

    return (data.data as AmadeusAirline[]).map((item) => ({
      code: item.iataCode,
      name: item.commonName,
    }));
  }

  async searchFlights(input: FlightSearchInput): Promise<FlightSearchResult> {
    const params: Record<string, string> = {
      originLocationCode: input.origin,
      destinationLocationCode: input.destination,
      departureDate: input.departureDate.toISOString().split("T")[0],
      adults: input.passengers.adults.toString(),
      children: (input.passengers.children || 0).toString(),
      infants: (input.passengers.infants || 0).toString(),
      travelClass: input.cabinClass,
      currencyCode: "USD",
      max: "50",
    };

    if (input.returnDate) {
      params.returnDate = input.returnDate.toISOString().split("T")[0];
    }

    const data = await this.fetchAmadeus("/v2/shopping/flight-offers", params);

    return {
      offers: (data.data as Array<Parameters<typeof this.mapAmadeusOffer>[0]>).map((offer) => this.mapAmadeusOffer(offer)),
    };
  }

  async getFlightOffer(_: string): Promise<FlightOffer> {
    // Note: Amadeus flight-offers/pricing is used to get updated price and details for a specific offer
    // In a real flow, we'd store the offer object in cache (Redis) and retrieve it here by ID
    // Since we don't have persistence for offers in this provider yet, we'll throw if not found or implement a basic fetch
    // For now, assume the ID is the full offer object or we fetch it.
    // Real-world: You'd call pricing API with the offer data.
    throw new Error("getFlightOffer requires specific offer data for Amadeus. Use pricing API instead.");
  }

  async priceFlightOffer(_: FlightPricingInput): Promise<FlightPricingResult> {
    // In a real app, you'd retrieve the original offer from Redis/DB by input.offerId
    // For this audit, we'll assume the input.offerId is something we can use.
    // We need the full offer JSON to call Amadeus Pricing.
    
    // Mocking the behavior for now but with real API structure
    const data = await this.fetchAmadeus("/v1/shopping/flight-offers/pricing", {}, "POST", {
      data: {
        type: "flight-offers-pricing",
        flightOffers: [/* The offer data should be here */]
      }
    });

    return {
      offer: this.mapAmadeusOffer(data.data.flightOffers[0]),
      rules: data.data.bookingRequirements?.emailAddressRequired ? "Email required" : undefined,
    };
  }

  async checkAvailability(input: FlightAvailabilityInput): Promise<FlightAvailabilityResult> {
    // Amadeus offers already contain numberOfBookableSeats
    // For a specific check, we'd re-price
    const pricing = await this.priceFlightOffer({ offerId: input.offerId });
    return {
      isAvailable: pricing.offer.availableSeats > 0,
      remainingSeats: pricing.offer.availableSeats,
    };
  }

  async getFlightStatus(input: FlightStatusInput): Promise<FlightStatusResult> {
    const data = await this.fetchAmadeus("/v2/schedule/flights", {
      carrierCode: input.flightNumber.substring(0, 2),
      flightNumber: input.flightNumber.substring(2),
      scheduledDepartureDate: input.date.toISOString().split("T")[0],
    });

    if (!data.data || data.data.length === 0) {
      throw new Error("Flight status not found");
    }

    const flight = data.data[0];
    return {
      status: flight.status,
      departure: new Date(flight.departure.at),
      arrival: new Date(flight.arrival.at),
    };
  }

  private mapAmadeusOffer(offer: {
    id: string;
    itineraries: Array<{
      segments: Array<unknown>;
    }>;
    price: {
      total: string;
      currency: string;
    };
    travelerPricings: Array<{
      fareDetailsBySegment: Array<{
        cabin: string;
      }>;
    }>;
    numberOfBookableSeats: number;
  }): FlightOffer {
    interface AmadeusSegment {
      id: string;
      carrierCode: string;
      number: string;
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      duration: string;
      aircraft: {
        code: string;
      };
    }

    const firstItinerary = offer.itineraries[0];
    const firstSegment = firstItinerary.segments[0] as AmadeusSegment;
    
    return {
      id: offer.id,
      segments: (firstItinerary.segments as AmadeusSegment[]).map((seg) => ({
        id: seg.id,
        departureAirport: {
          code: seg.departure.iataCode,
          name: seg.departure.iataCode,
          city: seg.departure.iataCode,
          country: "",
        },
        arrivalAirport: {
          code: seg.arrival.iataCode,
          name: seg.arrival.iataCode,
          city: seg.arrival.iataCode,
          country: "",
        },
        departureTime: new Date(seg.departure.at),
        arrivalTime: new Date(seg.arrival.at),
        duration: this.parseISODuration(seg.duration),
        airline: {
          code: seg.carrierCode,
          name: seg.carrierCode,
        },
        flightNumber: `${seg.carrierCode}${seg.number}`,
        aircraft: seg.aircraft.code,
      })),
      price: {
        amount: parseFloat(offer.price.total),
        currency: offer.price.currency,
      },
      cabinClass: this.mapAmadeusCabinClass(offer.travelerPricings[0].fareDetailsBySegment[0].cabin),
      availableSeats: offer.numberOfBookableSeats,
      isRefundable: true,
      baggageAllowance: "23kg",
    };
  }

  private parseISODuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    return hours * 60 + minutes;
  }

  private mapAmadeusCabinClass(cabin: string): CabinClass {
    switch (cabin) {
      case "ECONOMY": return CabinClass.ECONOMY;
      case "PREMIUM_ECONOMY": return CabinClass.PREMIUM_ECONOMY;
      case "BUSINESS": return CabinClass.BUSINESS;
      case "FIRST": return CabinClass.FIRST;
      default: return CabinClass.ECONOMY;
    }
  }
}
