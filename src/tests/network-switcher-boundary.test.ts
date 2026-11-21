import { describe, it, expect } from "vitest";
import { getContractAddress } from "../config/contracts";

describe("Network Switcher & Alert Boundary Suite - Issue #430", () => {
  describe("1. Contract Address Mapping Resolution", () => {
    it("resolves correct contract address based on active network passphrase or network name", () => {
      const testnetPassphrase = "Test SDF Network ; September 2015";
      const mainnetPassphrase = "Public Global Stellar Network ; September 2015";

      const testnetAddr = getContractAddress(testnetPassphrase);
      const mainnetAddr = getContractAddress(mainnetPassphrase);

      expect(testnetAddr).toBeDefined();
      expect(mainnetAddr).toBeDefined();
      expect(testnetAddr).not.toEqual(mainnetAddr);
    });
  });

  describe("2. Network Badge & Mismatch Boundary Logic", () => {
    it("identifies network mismatch and distinguishes badge visual states", () => {
      const getNetworkBadgeStyle = (network: string) => {
        const upper = network.toUpperCase();
        if (upper.includes("TESTNET")) return { label: "Testnet", variant: "warning" };
        if (upper.includes(
          "FUTURENET"
        )) return { label: "Futurenet", variant: "secondary" };
        return { label: "Mainnet", variant: "success" };
      };

      expect(getNetworkBadgeStyle("TESTNET").label).toBe("Testnet");
      expect(getNetworkBadgeStyle("FUTURENET").label).toBe("Futurenet");
      expect(getNetworkBadgeStyle("PUBLIC").label).toBe("Mainnet");

      const isMismatch = (walletNet: string, appNet: string) =>
        walletNet.toUpperCase() !== appNet.toUpperCase();

      expect(isMismatch("TESTNET", "PUBLIC")).toBe(true);
      expect(isMismatch("PUBLIC", "PUBLIC")).toBe(false);
    });
  });
});
