import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlightCard } from "./flight-card";
import type { FlightOffer } from "@/server/providers/flight/types";

const mockOffer: FlightOffer = {
  id: "1",
  segments: [
    {
      id: "s1",
      departureAirport: {
        code: "HAN",
        name: "Noi Bai",
        city: "Hanoi",
        country: "Vietnam",
      },
      arrivalAirport: {
        code: "SGN",
        name: "Tan Son Nhat",
        city: "Ho Chi Minh City",
        country: "Vietnam",
      },
      departureTime: new Date("2026-05-24T08:00:00Z"),
      arrivalTime: new Date("2026-05-24T10:00:00Z"),
      duration: 120,
      airline: {
        code: "VN",
        name: "Vietnam Airlines",
      },
      flightNumber: "VN123",
      aircraft: "Airbus A350",
    },
  ],
  price: {
    amount: 100,
    currency: "USD",
  },
  cabinClass: "ECONOMY",
  availableSeats: 10,
  isRefundable: true,
  baggageAllowance: "23kg",
};

describe("FlightCard", () => {
  it("renders flight information correctly", () => {
    render(<FlightCard offer={mockOffer} />);
    
    expect(screen.getByText("Vietnam Airlines")).toBeInTheDocument();
    expect(screen.getByText("HAN")).toBeInTheDocument();
    expect(screen.getByText("SGN")).toBeInTheDocument();
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });
});
