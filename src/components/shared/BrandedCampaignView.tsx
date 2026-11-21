import React from "react";

import type { AdvertiserBrandConfig } from "../../lib/branding";

interface BrandedCampaignViewProps {
  campaignName?: string;
  advertiser?: string;
  rewardRate?: string;
  bannerUrl?: string;
  referralLink?: string;
  brandConfig?: AdvertiserBrandConfig;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const BrandedCampaignView: React.FC<BrandedCampaignViewProps> = ({
  campaignName,
  advertiser,
  rewardRate,
  bannerUrl,
  referralLink,
  brandConfig,
}) => {
  const effectiveBanner = bannerUrl || brandConfig?.bannerUrl || "";
  const effectiveName = campaignName || brandConfig?.brandName || "Campaign";
  const effectiveAdvertiser = advertiser || brandConfig?.tagline || "Advertiser";
  const effectiveRate = rewardRate || "15% on sale";
  const effectiveLink = referralLink || "https://stormsale.xyz";

  return (
    <div className="branded-campaign-view">
      {effectiveBanner && <img src={effectiveBanner} alt={effectiveName} />}
      <h2>{effectiveName}</h2>
      <p>{effectiveAdvertiser}</p>
      <span>{effectiveRate}</span>
      <input type="text" readOnly value={effectiveLink} />
    </div>
  );
};
