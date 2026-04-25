import ShareButton, { type SharePlatform } from "./ShareButton";
import { Share2 } from "lucide-react";
import type { Article } from "@/lib/data";

export interface ShareButtonsProps {
  article: Article;
  onShare?: (platform: SharePlatform) => void;
  showLabel?: boolean;
  className?: string;
}

export default function ShareButtons({
  article,
  onShare,
  showLabel = true,
  className = "",
}: ShareButtonsProps) {
  const platforms: SharePlatform[] = ['twitter', 'linkedin', 'whatsapp', 'email', 'copy'];

  return (
    <div
      className={`flex flex-wrap items-center gap-3 py-5 ${className}`}
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {showLabel && (
        <span className="text-sm font-semibold text-white/60 mr-2 flex items-center gap-2">
          <Share2 size={14} /> Share
        </span>
      )}
      {platforms.map((platform) => (
        <ShareButton
          key={platform}
          article={article}
          platform={platform}
          onShare={onShare}
        />
      ))}
    </div>
  );
}
