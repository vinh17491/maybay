import { 
  AirportSearchInput, 
  AirportSearchResult, 
  AirlineSearchInput, 
  AirlineSearchResult, 
  FlightSearchInput, 
  FlightSearchResult, 
  FlightOffer, 
  FlightPricingInput, 
  FlightPricingResult, 
  FlightAvailabilityInput, 
  FlightAvailabilityResult, 
  FlightStatusInput, 
  FlightStatusResult, 
  FlightProvider 
} from "./types";
import { CabinClass } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export class MockProvider implements FlightProvider {
  async searchAirports(input: AirportSearchInput): Promise<AirportSearchResult[]> {
    const dbAirports = await prisma.airport.findMany({
      where: {
        OR: [
          { code: { contains: input.query, mode: 'insensitive' } },
          { name: { contains: input.query, mode: 'insensitive' } },
          { city: { contains: input.query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    if (dbAirports.length > 0) {
      return dbAirports.map(a => ({
        code: a.code || a.icaoCode || "",
        name: a.name,
        city: a.city,
        country: a.country,
      }));
    }

    const airports = [
      { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam" },
      { code: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam" },
      { code: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam" },
      { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
      { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
    ];
    
    return airports.filter(a => 
      a.code.toLowerCase().includes(input.query.toLowerCase()) || 
      a.city.toLowerCase().includes(input.query.toLowerCase()) ||
      a.name.toLowerCase().includes(input.query.toLowerCase())
    );
  }

  async searchAirlines(input: AirlineSearchInput): Promise<AirlineSearchResult[]> {
    const dbAirlines = await prisma.airline.findMany({
      where: {
        OR: [
          { code: { contains: input.query, mode: 'insensitive' } },
          { name: { contains: input.query, mode: 'insensitive' } },
        ],
        active: true,
      },
      take: 10,
    });

    if (dbAirlines.length > 0) {
      return dbAirlines.map(a => ({
        code: a.code || a.icaoCode || "",
        name: a.name,
      }));
    }

    const airlines = [
      { code: "VN", name: "Vietnam Airlines" },
      { code: "VJ", name: "VietJet Air" },
      { code: "QH", name: "Bamboo Airways" },
      { code: "SQ", name: "Singapore Airlines" },
    ];

    return airlines.filter(a => 
      a.code.toLowerCase().includes(input.query.toLowerCase()) || 
      a.name.toLowerCase().includes(input.query.toLowerCase())
    );
  }

  async searchFlights(input: FlightSearchInput): Promise<FlightSearchResult> {
    // Attempt to find real routes in DB
    const dbRoutes = await prisma.route.findMany({
      where: {
        sourceAirport: { code: input.origin },
        destinationAirport: { code: input.destination },
      },
      include: {
        airline: true,
        sourceAirport: true,
        destinationAirport: true,
      },
      take: 5,
    });

    if (dbRoutes.length > 0) {
      const offers: FlightOffer[] = dbRoutes.map((route, index) => ({
        id: `db-offer-${route.id}-${index}`,
        price: { amount: 100 + Math.floor(Math.random() * 500), currency: "USD" },
        cabinClass: input.cabinClass,
        availableSeats: 15,
        isRefundable: true,
        baggageAllowance: "23kg",
        segments: [
          {
            id: `seg-${route.id}`,
            departureAirport: {
              code: route.sourceAirport.code || "",
              name: route.sourceAirport.name || "",
              city: route.sourceAirport.city || "",
              country: route.sourceAirport.country || "",
            },
            arrivalAirport: {
              code: route.destinationAirport.code || "",
              name: route.destinationAirport.name || "",
              city: route.destinationAirport.city || "",
              country: route.destinationAirport.country || "",
            },
            departureTime: new Date(input.departureDate.getTime() + (2 + index) * 60 * 60 * 1000),
            arrivalTime: new Date(input.departureDate.getTime() + (4 + index) * 60 * 60 * 1000),
            duration: 120,
            airline: {
              code: route.airline.code || "",
              name: route.airline.name || "",
            },
            flightNumber: `${route.airline.code}${100 + index}`,
            aircraft: route.equipment?.split(' ')[0] || "Boeing 737",
          }
        ]
      }));
      return { offers };
    }

    // Fallback to mock
    const offers: FlightOffer[] = [
      {
        id: "mock-offer-1",
        price: { amount: 150, currency: "USD" },
        cabinClass: input.cabinClass,
        availableSeats: 10,
        isRefundable: true,
        baggageAllowance: "23kg",
        segments: [
          {
            id: "seg-1",
            departureAirport: {
              code: input.origin,
              name: "Tan Son Nhat",
              city: "Ho Chi Minh City",
              country: "Vietnam",
            },
            arrivalAirport: {
              code: input.destination,
              name: "Noi Bai",
              city: "Hanoi",
              country: "Vietnam",
            },
            departureTime: new Date(input.departureDate.getTime() + 2 * 60 * 60 * 1000),
            arrivalTime: new Date(input.departureDate.getTime() + 4 * 60 * 60 * 1000),
            duration: 120,
            airline: { code: "VN", name: "Vietnam Airlines" },
            flightNumber: "VN123",
            aircraft: "Airbus A350",
          }
        ]
      },
      {
        id: "mock-offer-2",
        price: { amount: 80, currency: "USD" },
        cabinClass: input.cabinClass,
        availableSeats: 25,
        isRefundable: false,
        baggageAllowance: "7kg",
        segments: [
          {
            id: "seg-2",
            departureAirport: {
              code: input.origin,
              name: "Tan Son Nhat",
              city: "Ho Chi Minh City",
              country: "Vietnam",
            },
            arrivalAirport: {
              code: input.destination,
              name: "Noi Bai",
              city: "Hanoi",
              country: "Vietnam",
            },
            departureTime: new Date(input.departureDate.getTime() + 5 * 60 * 60 * 1000),
            arrivalTime: new Date(input.departureDate.getTime() + 7 * 60 * 60 * 1000),
            duration: 120,
            airline: { code: "VJ", name: "VietJet Air" },
            flightNumber: "VJ456",
            aircraft: "Airbus A321",
          }
        ]
      }
    ];

    return { offers };
  }

  async getFlightOffer(id: string): Promise<FlightOffer> {
    return {
      id,
      price: { amount: 150, currency: "USD" },
      cabinClass: "ECONOMY" as CabinClass,
      availableSeats: 10,
      isRefundable: true,
      baggageAllowance: "23kg",
      segments: [
        {
          id: "seg-1",
          departureAirport: {
            code: "SGN",
            name: "Tan Son Nhat",
            city: "Ho Chi Minh City",
            country: "Vietnam",
          },
          arrivalAirport: {
            code: "HAN",
            name: "Noi Bai",
            city: "Hanoi",
            country: "Vietnam",
          },
          departureTime: new Date(),
          arrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          duration: 120,
          airline: { code: "VN", name: "Vietnam Airlines" },
          flightNumber: "VN123",
          aircraft: "Airbus A350",
        }
      ]
    };
  }

  async priceFlightOffer(input: FlightPricingInput): Promise<FlightPricingResult> {
    const offer = await this.getFlightOffer(input.offerId);
    return { offer, rules: "Non-refundable, 20kg baggage included." };
  }

  async checkAvailability(_input: FlightAvailabilityInput): Promise<FlightAvailabilityResult> {
    return { isAvailable: true, remainingSeats: 5 };
  }

  async getFlightStatus(input: FlightStatusInput): Promise<FlightStatusResult> {
    return {
      status: "ON_TIME",
      departure: input.date,
      arrival: new Date(input.date.getTime() + 2 * 60 * 60 * 1000),
    };
  }
}
