import { describe, it, expect } from "vitest";
import { MockProvider } from "./mock.provider";
import { CabinClass } from "@prisma/client";

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
    expect(flights.offers[0].segments[0].departure.airport).toBe("HAN");
    expect(flights.offers[0].segments[0].arrival.airport).toBe("SGN");
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
