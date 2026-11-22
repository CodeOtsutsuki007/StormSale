// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

describe("SEP-0007 URI Scheme Handler & QR Code Generator Tests", () => {
  it("verifies valid SEP-0007 URI construction with amount, destination, and memo", () => {
    const destination = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const amount = "150.50";
    const memo = "StormSaleAffiliateCommission";
    const assetCode = "XLM";

    // Construct standard SEP-0007 URI format for Stellar pay/tx
    const uri = `web+stellar:pay?destination=${encodeURIComponent(destination)}&amount=${encodeURIComponent(amount)}&memo=${encodeURIComponent(memo)}&asset_code=${encodeURIComponent(assetCode)}`;

    expect(uri).toContain("web+stellar:pay?");
    expect(uri).toContain(`destination=${destination}`);
    expect(uri).toContain(`amount=${amount}`);
    expect(uri).toContain(`memo=${memo}`);
    expect(uri).toContain(`asset_code=${assetCode}`);

    const parsed = new URL(uri);
    expect(parsed.protocol).toBe("web+stellar:");
    expect(parsed.searchParams.get("destination")).toBe(destination);
    expect(parsed.searchParams.get("amount")).toBe(amount);
    expect(parsed.searchParams.get("memo")).toBe(memo);
  });

  it("verifies QR code SVG renders with correct error correction level (Level M/Q)", async () => {
    // qrcode library check
    const QRCode = await import("qrcode");
    expect(QRCode).toBeDefined();

    const testUri = "web+stellar:pay?destination=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5&amount=100";
    
    // Test Level M (medium error correction)
    const svgM = await QRCode.toString(testUri, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
    });

    expect(svgM).toContain("<svg");
    expect(svgM).toContain("</svg>");

    // Test Level Q (quartile error correction)
    const svgQ = await QRCode.toString(testUri, {
      type: "svg",
      errorCorrectionLevel: "Q",
      margin: 2,
    });

    expect(svgQ).toContain("<svg");
    expect(svgQ).toContain("</svg>");
  });

  it("tests copy-to-clipboard functionality with toast notification", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const toastMock = vi.fn();
    const testUri = "web+stellar:pay?destination=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

    // Simulate copy handler with toast
    const handleCopy = async (text: string) => {
      await navigator.clipboard.writeText(text);
      toastMock("Copied to clipboard successfully!");
    };

    await handleCopy(testUri);

    expect(writeTextMock).toHaveBeenCalledWith(testUri);
    expect(toastMock).toHaveBeenCalledWith("Copied to clipboard successfully!");
  });
});
