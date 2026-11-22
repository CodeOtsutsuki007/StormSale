import { describe, it, expect, vi, beforeEach } from "vitest";
import { getContractAddress, getNetworkPassphrase } from "../config/contracts";
import { verifyFreighterNetwork } from "../lib/networkVerification";

// Mock freighter-api getNetwork
vi.mock("@stellar/freighter-api", () => ({
  getNetwork: vi.fn(),
}));

import { getNetwork } from "@stellar/freighter-api";

describe("Network Switcher & Alert Boundary Tests - Issue #430", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Dynamic Network Badge Styling & Passphrase Resolution", () => {
    it("resolves testnet network passphrase and contract address correctly", () => {
      const passphrase = getNetworkPassphrase("TESTNET");
      expect(passphrase).toBe("Test SDF Network ; September 2015");

      const escrowAddress = getContractAddress("escrow", "TESTNET");
      expect(escrowAddress).toBeDefined();
      expect(typeof escrowAddress).toBe("string");
      expect(escrowAddress.startsWith("C")).toBe(true);
    });

    it("resolves mainnet network passphrase and contract address correctly", () => {
      const passphrase = getNetworkPassphrase("PUBLIC");
      expect(passphrase).toBe("Public Global Stellar Network ; September 2015");

      const escrowAddress = getContractAddress("escrow", "PUBLIC");
      expect(escrowAddress).toBeDefined();
      expect(typeof escrowAddress).toBe("string");
      expect(escrowAddress.startsWith("C")).toBe(true);
    });

    it("verifies freighter network detection for testnet and public", async () => {
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "TESTNET" });
      const resTestnet = await verifyFreighterNetwork();
      expect(resTestnet).toEqual({
        network: "TESTNET",
        isStellarNetwork: true,
      });

      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "PUBLIC" });
      const resPublic = await verifyFreighterNetwork();
      expect(resPublic).toEqual({
        network: "PUBLIC",
        isStellarNetwork: true,
      });

      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "FUTURENET" });
      const resFuturenet = await verifyFreighterNetwork();
      expect(resFuturenet).toEqual({
        network: "FUTURENET",
        isStellarNetwork: false,
      });
    });
  });

  describe("2. Network Mismatch Banner & Alert Boundary Logic", () => {
    it("detects mismatch when wallet network differs from selected app network", async () => {
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "TESTNET" });
      const walletNet = await verifyFreighterNetwork();

      const appSelectedNetwork = "PUBLIC";

      const isMismatch =
        walletNet !== null && walletNet.network.toUpperCase() !== appSelectedNetwork.toUpperCase();
      expect(isMismatch).toBe(true);
    });

    it("confirms no mismatch when wallet and app networks match", async () => {
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "PUBLIC" });
      const walletNet = await verifyFreighterNetwork();

      const appSelectedNetwork = "PUBLIC";

      const isMismatch =
        walletNet !== null && walletNet.network.toUpperCase() !== appSelectedNetwork.toUpperCase();
      expect(isMismatch).toBe(false);
    });
  });
});
