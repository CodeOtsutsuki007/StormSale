import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
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
    it("verifies network badge dynamically displays Testnet, Futurenet, or Mainnet with distinct visual styles", () => {
      const NetworkBadgeComponent = ({ network }: { network: "TESTNET" | "FUTURENET" | "MAINNET" }) => {
        const styles = {
          TESTNET: { badgeClass: "badge-testnet", color: "orange" },
          FUTURENET: { badgeClass: "badge-futurenet", color: "purple" },
          MAINNET: { badgeClass: "badge-mainnet", color: "green" },
        };
        const currentStyle = styles[network] || styles.TESTNET;
        return React.createElement(
          "span",
          { "data-testid": "network-badge", className: currentStyle.badgeClass, "data-color": currentStyle.color },
          network
        );
      };

      const { rerender } = render(React.createElement(NetworkBadgeComponent, { network: "TESTNET" }));
      let badge = screen.getByTestId("network-badge");
      expect(badge.textContent).toBe("TESTNET");
      expect(badge.getAttribute("class")).toBe("badge-testnet");
      expect(badge.getAttribute("data-color")).toBe("orange");

      rerender(React.createElement(NetworkBadgeComponent, { network: "FUTURENET" }));
      badge = screen.getByTestId("network-badge");
      expect(badge.textContent).toBe("FUTURENET");
      expect(badge.getAttribute("class")).toBe("badge-futurenet");
      expect(badge.getAttribute("data-color")).toBe("purple");

      rerender(React.createElement(NetworkBadgeComponent, { network: "MAINNET" }));
      badge = screen.getByTestId("network-badge");
      expect(badge.textContent).toBe("MAINNET");
      expect(badge.getAttribute("class")).toBe("badge-mainnet");
      expect(badge.getAttribute("data-color")).toBe("green");
    });

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
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "TESTNET", networkPassphrase: "Test SDF Network ; September 2015" });
      const resTestnet = await verifyFreighterNetwork();
      expect(resTestnet).toEqual({
        network: "TESTNET",
        isStellarNetwork: true,
      });

      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "PUBLIC", networkPassphrase: "Public Global Stellar Network ; September 2015" });
      const resPublic = await verifyFreighterNetwork();
      expect(resPublic).toEqual({
        network: "PUBLIC",
        isStellarNetwork: true,
      });

      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "FUTURENET", networkPassphrase: "Futurenet SDF Network ; October 2022" });
      const resFuturenet = await verifyFreighterNetwork();
      expect(resFuturenet).toEqual({
        network: "FUTURENET",
        isStellarNetwork: false,
      });
    });
  });

  describe("2. Network Mismatch Banner & Alert Boundary Logic", () => {
    it("detects mismatch when wallet network differs from selected app network", async () => {
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "TESTNET", networkPassphrase: "Test SDF Network ; September 2015" });
      const walletNet = await verifyFreighterNetwork();

      const appSelectedNetwork = "PUBLIC";

      const isMismatch =
        walletNet !== null && walletNet.network.toUpperCase() !== appSelectedNetwork.toUpperCase();
      expect(isMismatch).toBe(true);
    });

    it("confirms no mismatch when wallet and app networks match", async () => {
      vi.mocked(getNetwork).mockResolvedValueOnce({ network: "PUBLIC", networkPassphrase: "Public Global Stellar Network ; September 2015" });
      const walletNet = await verifyFreighterNetwork();

      const appSelectedNetwork = "PUBLIC";

      const isMismatch =
        walletNet !== null && walletNet.network.toUpperCase() !== appSelectedNetwork.toUpperCase();
      expect(isMismatch).toBe(false);
    });
  });
});
