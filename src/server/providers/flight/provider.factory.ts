import { FlightProvider } from "./types";
import { MockProvider } from "./mock.provider";
import { AmadeusProvider } from "./amadeus.provider";
import { AviationStackProvider } from "./aviation-stack.provider";

export class FlightProviderFactory {
  static getProvider(type: "amadeus" | "aviationstack" | "mock" = "mock"): FlightProvider {
    switch (type) {
      case "mock":
        return new MockProvider();
      case "amadeus":
        return new AmadeusProvider();
      case "aviationstack":
        return new AviationStackProvider();
      default:
        return new MockProvider();
    }
  }

  static getDefaultProvider(): FlightProvider {
    const providerType = (process.env.FLIGHT_PROVIDER as any) || "mock";
    return this.getProvider(providerType);
  }
}
