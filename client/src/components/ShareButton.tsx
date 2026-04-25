import { ReactNode } from "react";
import { toast } from "sonner";
import { Facebook, Twitter, Linkedin, MessageCircle, Mail, Link2 } from "lucide-react";
import type { Article } from "@/lib/data";

export type SharePlatform = 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'copy';

export interface ShareButtonProps {
  article: Article;
  platform: SharePlatform;
  text?: string;
  className?: string;
  onShare?: (platform: SharePlatform) => void;
}

interface ShareConfig {
  label: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const SHARE_CONFIGS: Record<SharePlatform, ShareConfig> = {
  facebook: {
    label: "Facebook",
    icon: <Facebook size={14} />,
    color: "#1877F2",
    bgColor: "rgba(24,119,242,0.12)",
    borderColor: "rgba(24,119,242,0.3)",
  },
  twitter: {
    label: "X / Twitter",
    icon: <Twitter size={14} />,
    color: "#1DA1F2",
    bgColor: "rgba(29,161,242,0.12)",
    borderColor: "rgba(29,161,242,0.3)",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Linkedin size={14} />,
    color: "#0A66C2",
    bgColor: "rgba(10,102,194,0.12)",
    borderColor: "rgba(10,102,194,0.3)",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <MessageCircle size={14} />,
    color: "#25D366",
    bgColor: "rgba(37,211,102,0.12)",
    borderColor: "rgba(37,211,102,0.3)",
  },
  email: {
    label: "Email",
    icon: <Mail size={14} />,
    color: "rgba(255,255,255,0.7)",
    bgColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  copy: {
    label: "Copy Link",
    icon: <Link2 size={14} />,
    color: "rgba(255,255,255,0.7)",
    bgColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
  },
};

function generateShareUrl(
  platform: SharePlatform,
  article: Article,
  customText?: string
): string {
  const articleUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://ctrl-alt-news.com/article/${article.id}`;

  const title = article.title.en;
  const author = article.author;
  const siteName = "Ctrl Alt News";

  const shareText = customText || `${title} by ${author} at ${siteName}`;

  switch (platform) {
    case 'facebook': {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    }
    case 'twitter': {
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}&via=ctrlaltnews`;
    }
    case 'linkedin': {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    }
    case 'whatsapp': {
      const whatsappText = `${title} - ${articleUrl}`;
      return `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    }
    case 'email': {
      const emailSubject = title;
      const emailBody = `Check out: ${title}\n\n${articleUrl}`;
      return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    }
    case 'copy': {
      return articleUrl;
    }
    default: {
      return articleUrl;
    }
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    toast.success("Link copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    toast.error("Failed to copy link");
  }
}

export default function ShareButton({
  article,
  platform,
  text,
  className = "",
  onShare,
}: ShareButtonProps) {
  const config = SHARE_CONFIGS[platform];
  const shareUrl = generateShareUrl(platform, article, text);

  const handleClick = async () => {
    if (platform === 'copy') {
      await copyToClipboard(shareUrl);
    } else {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    onShare?.(platform);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        color: config.color,
      }}
      aria-label={`Share on ${config.label}`}
      title={config.label}
    >
      {config.icon}
      {config.label}
    </button>
  );
}
