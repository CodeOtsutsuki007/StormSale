import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import QRCode from "qrcode";

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

/**
 * SEP-0007 URI Scheme & QR Generator Unit Tests
 * Acceptance Criteria:
 * 1. Verify valid SEP-0007 URI construction with amount, destination, and memo.
 * 2. Verify QR code SVG renders with correct error correction level (Level M/Q).
 * 3. Test copy-to-clipboard functionality with toast notification.
 */

interface Sep0007Params {
  destination: string;
  amount?: string;
  memo?: string;
  memoType?: "text" | "id" | "hash";
  assetCode?: string;
  assetIssuer?: string;
}

export function buildSep0007Uri(params: Sep0007Params): string {
  const { destination, amount, memo, memoType, assetCode, assetIssuer } = params;
  if (!destination || !destination.startsWith("G")) {
    throw new Error("Invalid Stellar destination address");
  }
  const url = new URL(`web+stellar:pay`);
  url.searchParams.set("destination", destination);
  if (amount) url.searchParams.set("amount", amount);
  if (memo) {
    url.searchParams.set("memo", memo);
    if (memoType) url.searchParams.set("memo_type", memoType);
  }
  if (assetCode) {
    url.searchParams.set("asset_code", assetCode);
    if (assetIssuer) url.searchParams.set("asset_issuer", assetIssuer);
  }
  return url.toString();
}

export interface QrSvgProps {
  value: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  size?: number;
}

export function QrCodeSvg({ value, errorCorrectionLevel = "M" }: QrSvgProps) {
  const [svgString, setSvgString] = React.useState<string>("");

  React.useEffect(() => {
    QRCode.toString(value, { type: "svg", errorCorrectionLevel }, (err, string) => {
      if (!err && string) {
        setSvgString(string);
      }
    });
  }, [value, errorCorrectionLevel]);

  return React.createElement("div", {
    "data-testid": "qr-code-svg-container",
    "data-error-correction": errorCorrectionLevel,
    dangerouslySetInnerHTML: { __html: svgString },
  });
}

export interface Sep0007CardProps {
  destination: string;
  amount?: string;
  memo?: string;
  onToast?: (message: string) => void;
}

export function Sep0007Card({ destination, amount, memo, onToast }: Sep0007CardProps) {
  const [copied, setCopied] = React.useState(false);
  const uri = buildSep0007Uri({ destination, amount, memo });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    if (onToast) {
      onToast("SEP-0007 URI copied to clipboard!");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return React.createElement(
    "div",
    { className: "p-4 border rounded shadow" },
    React.createElement("h3", null, "Stellar Payment URI"),
    React.createElement("input", { "aria-label": "uri-input", readOnly: true, value: uri, className: "border p-1 w-full" }),
    React.createElement(QrCodeSvg, { value: uri, errorCorrectionLevel: "Q" }),
    React.createElement(
      "button",
      { onClick: handleCopy, className: "mt-2 px-4 py-2 bg-blue-600 text-white rounded" },
      copied ? "Copied!" : "Copy URI"
    ),
    copied && React.createElement("div", { "data-testid": "toast-notification" }, "SEP-0007 URI copied to clipboard!")
  );
}

describe("SEP-0007 URI Scheme Handler and QR Code Generator Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies valid SEP-0007 URI construction with amount, destination, and memo", () => {
    const destination = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const amount = "100.50";
    const memo = "Invoice-9921";

    const uri = buildSep0007Uri({
      destination,
      amount,
      memo,
      memoType: "text",
    });

    expect(uri).toContain("web+stellar:pay?");
    expect(uri).toContain(`destination=${encodeURIComponent(destination)}`);
    expect(uri).toContain(`amount=${amount}`);
    expect(uri).toContain(`memo=${encodeURIComponent(memo)}`);
    expect(uri).toContain("memo_type=text");
  });

  it("throws an error for invalid destination addresses", () => {
    expect(() => buildSep0007Uri({ destination: "INVALID" })).toThrow(
      "Invalid Stellar destination address",
    );
  });

  it("verifies QR code SVG renders with correct error correction level (Level M/Q)", async () => {
    const testUri = "web+stellar:pay?destination=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5&amount=50";
    
    render(React.createElement(QrCodeSvg, { value: testUri, errorCorrectionLevel: "Q" }));

    await waitFor(() => {
      const container = screen.getByTestId("qr-code-svg-container");
      expect(container.getAttribute("data-error-correction")).toBe("Q");
      expect(container.innerHTML).toContain("<svg");
    });
  });

  it("tests copy-to-clipboard functionality with toast notification", async () => {
    const toastSpy = vi.fn();
    const destination = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

    render(
      React.createElement(Sep0007Card, {
        destination,
        amount: "25",
        memo: "TestMemo",
        onToast: toastSpy,
      }),
    );

    const copyButton = screen.getByRole("button", { name: /copy uri/i });
    expect(copyButton).toBeDefined();

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining("web+stellar:pay?"),
      );
      expect(toastSpy).toHaveBeenCalledWith("SEP-0007 URI copied to clipboard!");
      expect(screen.getByTestId("toast-notification")).toBeDefined();
      expect(screen.getByText("Copied!")).toBeDefined();
    });
  });
});
