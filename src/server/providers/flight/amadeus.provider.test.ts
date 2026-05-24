import { describe, it, expect, vi, beforeEach } from "vitest";
import { AmadeusProvider } from "./amadeus.provider";

describe("AmadeusProvider", () => {
  let provider: AmadeusProvider;

  beforeEach(() => {
    provider = new AmadeusProvider();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should authenticate and search airports", async () => {
    // Mock Auth Token
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "test_token", expires_in: 3600 }),
    });

    // Mock Airport Search
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            iataCode: "SGN",
            name: "Tan Son Nhat",
            address: { cityName: "Ho Chi Minh City", countryName: "Vietnam" },
          },
        ],
      }),
    });

    const results = await provider.searchAirports({ query: "SGN" });

    expect(results).toHaveLength(1);
    expect(results[0].code).toBe("SGN");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
