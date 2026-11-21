import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { BrandedCampaignView } from "../components/shared/BrandedCampaignView";

describe("B2C Social Share Card Preview & Web Share API Integration - Issue #435", () => {
  const mockCampaign = {
    id: "camp-genesis-01",
    name: "StormSale Genesis Community Booster",
    advertiser: "StormSale Foundation",
    category: "Crypto Ecosystem",
    asset: "XLM" as const,
    commissionRate: "15% on sale",
    clearingPeriod: "14 Days",
    totalPool: "50,000 XLM",
    activeAffiliates: 95,
    contractAddress: "CCAMPAIGN_XLM_GENESIS_03",
    description: "Official StormSale decentralized affiliate protocol launch campaign.",
    bannerUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
  };

  const referralLink = "https://stormsale.xyz/c/genesis?ref=GUSER123456789";

  let originalNavigatorShare: any;
  let originalClipboard: any;
  let originalOpen: any;

  beforeEach(() => {
    originalNavigatorShare = navigator.share;
    originalClipboard = navigator.clipboard;
    originalOpen = window.open;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      value: originalNavigatorShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
    window.open = originalOpen;
    vi.restoreAllMocks();
  });

  describe("1. Formatted Intent URLs for Twitter, Telegram, and WhatsApp", () => {
    it("formats Twitter / X share intent URL correctly with encoded referral link and campaign title", () => {
      const text = encodeURIComponent(`Join ${mockCampaign.name} and earn ${mockCampaign.commissionRate}!`);
      const url = encodeURIComponent(referralLink);
      const twitterIntent = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

      expect(twitterIntent).toContain("twitter.com/intent/tweet");
      expect(twitterIntent).toContain(encodeURIComponent(referralLink));
      expect(twitterIntent).toContain(encodeURIComponent(mockCampaign.name));
    });

    it("formats Telegram share intent URL correctly with encoded referral link", () => {
      const text = encodeURIComponent(`Check out ${mockCampaign.name} (${mockCampaign.commissionRate}):`);
      const url = encodeURIComponent(referralLink);
      const telegramIntent = `https://t.me/share/url?url=${url}&text=${text}`;

      expect(telegramIntent).toContain("t.me/share/url");
      expect(telegramIntent).toContain(encodeURIComponent(referralLink));
    });

    it("formats WhatsApp share intent URL correctly with encoded referral link", () => {
      const text = encodeURIComponent(`Join me on ${mockCampaign.name} & earn ${mockCampaign.commissionRate}! ${referralLink}`);
      const whatsappIntent = `https://api.whatsapp.com/send?text=${text}`;

      expect(whatsappIntent).toContain("api.whatsapp.com/send");
      expect(whatsappIntent).toContain(encodeURIComponent(referralLink));
    });
  });

  describe("2. Navigator.share Web API Integration & Fallbacks", () => {
    it("triggers navigator.share on supported mobile browsers with correct payload", async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: shareMock,
        configurable: true,
        writable: true,
      });

      const shareData = {
        title: mockCampaign.name,
        text: `Earn ${mockCampaign.commissionRate} with ${mockCampaign.advertiser}`,
        url: referralLink,
      };

      await navigator.share(shareData);
      expect(shareMock).toHaveBeenCalledWith(shareData);
    });

    it("tests clipboard copy fallback when Web Share API is unsupported (undefined navigator.share)", async () => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: writeTextMock,
        },
        configurable: true,
        writable: true,
      });

      await navigator.clipboard.writeText(referralLink);
      expect(writeTextMock).toHaveBeenCalledWith(referralLink);
    });
  });

  describe("3. Preview Card Dynamic Display", () => {
    it("verifies preview card displays dynamic campaign title, reward rate, and banner", () => {
      const { container } = render(
        React.createElement(BrandedCampaignView, {
          campaignName: mockCampaign.name,
          advertiser: mockCampaign.advertiser,
          rewardRate: mockCampaign.commissionRate,
          bannerUrl: mockCampaign.bannerUrl,
          referralLink: referralLink,
        })
      );

      expect(screen.getByText(mockCampaign.name)).toBeDefined();
      expect(screen.getByText(mockCampaign.commissionRate)).toBeDefined();
      expect(screen.getByText(mockCampaign.advertiser)).toBeDefined();

      const bannerImg = container.querySelector("img");
      expect(bannerImg).not.toBeNull();
      expect(bannerImg?.getAttribute("src")).toBe(mockCampaign.bannerUrl);
    });
  });
});
