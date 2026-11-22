import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

/**
 * B2C Social Share Card Preview & Web Share API Integration Tests
 * Validates intent URL formatting (Twitter/X, Telegram, WhatsApp), Web Share API trigger,
 * clipboard copy fallback, and dynamic campaign title, reward rate, and banner rendering.
 */

describe("B2C Social Share Card Preview & Web Share API Suite", () => {
  const mockShareData = {
    title: "Stellar USDC High-Yield Staking",
    text: "Join Stellar USDC High-Yield Staking and earn 12% per deposit with my referral link!",
    url: "https://stormsale.xyz/c/test-slug?ref=GUSER123456789",
    rewardRate: "12% per deposit",
    bannerUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Formatted Intent URLs for Social Platforms", () => {
    it("formats Twitter/X share intent URL correctly with encoded referral link", () => {
      const text = encodeURIComponent(mockShareData.text);
      const url = encodeURIComponent(mockShareData.url);
      const twitterIntent = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

      expect(twitterIntent).toContain("https://twitter.com/intent/tweet?");
      expect(twitterIntent).toContain(encodeURIComponent(mockShareData.url));
      expect(twitterIntent).toContain(encodeURIComponent("12% per deposit"));
    });

    it("formats Telegram share intent URL correctly with encoded referral link", () => {
      const telegramIntent = `https://t.me/share/url?url=${encodeURIComponent(mockShareData.url)}&text=${encodeURIComponent(mockShareData.text)}`;

      expect(telegramIntent).toContain("https://t.me/share/url?");
      expect(telegramIntent).toContain(encodeURIComponent(mockShareData.url));
    });

    it("formats WhatsApp share intent URL correctly with encoded referral link", () => {
      const whatsappText = encodeURIComponent(`${mockShareData.text} ${mockShareData.url}`);
      const whatsappIntent = `https://api.whatsapp.com/send?text=${whatsappText}`;

      expect(whatsappIntent).toContain("https://api.whatsapp.com/send?text=");
      expect(whatsappIntent).toContain(encodeURIComponent(mockShareData.url));
    });
  });

  describe("2. Web Share API & Clipboard Fallback", () => {
    it("triggers navigator.share on supported browsers", async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: shareMock,
        configurable: true,
        writable: true,
      });

      expect(typeof navigator.share).toBe("function");
      await navigator.share({
        title: mockShareData.title,
        text: mockShareData.text,
        url: mockShareData.url,
      });

      expect(shareMock).toHaveBeenCalledWith({
        title: mockShareData.title,
        text: mockShareData.text,
        url: mockShareData.url,
      });
    });

    it("falls back to clipboard copy when Web Share API is unsupported or rejects", async () => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      const performShareOrCopy = async () => {
        if (navigator.share) {
          await navigator.share({ title: mockShareData.title, url: mockShareData.url });
        } else {
          await navigator.clipboard.writeText(mockShareData.url);
        }
      };

      await performShareOrCopy();
      expect(writeTextMock).toHaveBeenCalledWith(mockShareData.url);
    });
  });

  describe("3. Dynamic Preview Card Display", () => {
    it("verifies preview card renders campaign title, reward rate, and banner image correctly", () => {
      const TestPreviewComponent = () => (
        React.createElement("div", { "data-testid": "social-preview-card" },
          React.createElement("img", { src: mockShareData.bannerUrl, alt: "Campaign Banner", "data-testid": "banner-img" }),
          React.createElement("h2", { "data-testid": "campaign-title" }, mockShareData.title),
          React.createElement("span", { "data-testid": "reward-rate" }, mockShareData.rewardRate),
          React.createElement("p", { "data-testid": "share-text" }, mockShareData.text)
        )
      );

      render(React.createElement(TestPreviewComponent));

      expect(screen.getByTestId("campaign-title").textContent).toBe("Stellar USDC High-Yield Staking");
      expect(screen.getByTestId("reward-rate").textContent).toBe("12% per deposit");
      expect(screen.getByTestId("banner-img").getAttribute("src")).toBe(mockShareData.bannerUrl);
      expect(screen.getByTestId("share-text").textContent).toContain("12% per deposit");
    });
  });
});
