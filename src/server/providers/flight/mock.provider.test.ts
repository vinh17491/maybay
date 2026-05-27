import { describe, it, expect, vi } from "vitest";
import { MockProvider } from "./mock.provider";
import { CabinClass } from "@prisma/client";

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    airport: { findMany: vi.fn().mockResolvedValue([]) },
    airline: { findMany: vi.fn().mockResolvedValue([]) },
    route: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("should return a list of flights", async () => {
    const flights = await provider.searchFlights({
      origin: "HAN",
      destination: "SGN",
      departureDate: new Date(),
      passengers: { adults: 1, children: 0, infants: 0 },
      cabinClass: CabinClass.ECONOMY,
    });

    expect(flights.offers).toBeDefined();
    expect(flights.offers.length).toBeGreaterThan(0);
    expect(flights.offers[0].segments[0].departureAirport.code).toBe("HAN");
    expect(flights.offers[0].segments[0].arrivalAirport.code).toBe("SGN");
  });

  it("should return airport search results", async () => {
    const airports = await provider.searchAirports({ query: "Hanoi" });
    expect(airports).toBeDefined();
    expect(airports.length).toBeGreaterThan(0);
    expect(airports[0].code).toBe("HAN");
  });

  it("should get a specific flight offer", async () => {
    const flights = await provider.searchFlights({
      origin: "HAN",
      destination: "SGN",
      departureDate: new Date(),
      passengers: { adults: 1, children: 0, infants: 0 },
      cabinClass: CabinClass.ECONOMY,
    });

    const offerId = flights.offers[0].id;
    const offer = await provider.getFlightOffer(offerId);

    expect(offer).toBeDefined();
    expect(offer.id).toBe(offerId);
  });
});
