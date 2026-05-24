import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlightCard } from "./flight-card";

// Mocking CabinClass since it might not be available during testing without proper prisma setup
enum CabinClass {
  ECONOMY = "ECONOMY",
  PREMIUM_ECONOMY = "PREMIUM_ECONOMY",
  BUSINESS = "BUSINESS",
  FIRST = "FIRST",
}

const mockOffer = {
  id: "1",
  airline: {
    code: "VN",
    name: "Vietnam Airlines",
  },
  segments: [
    {
      id: "s1",
      departure: {
        airport: "HAN",
        time: new Date("2026-05-24T08:00:00Z"),
      },
      arrival: {
        airport: "SGN",
        time: new Date("2026-05-24T10:00:00Z"),
      },
      duration: 120,
      flightNumber: "VN123",
      aircraft: "Airbus A350",
    },
  ],
  price: {
    amount: 100,
    currency: "USD",
  },
  cabinClass: CabinClass.ECONOMY,
  availableSeats: 10,
};

describe("FlightCard", () => {
  it("renders flight information correctly", () => {
    render(<FlightCard offer={mockOffer as any} />);
    
    expect(screen.getByText("Vietnam Airlines")).toBeInTheDocument();
    expect(screen.getByText("HAN")).toBeInTheDocument();
    expect(screen.getByText("SGN")).toBeInTheDocument();
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });
});
