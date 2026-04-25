import type { Article } from "./data";

export type SharePlatform = 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'copy';

export interface ShareEvent {
  event_name: 'article_shared';
  article_id: number;
  article_title: string;
  platform: SharePlatform;
  timestamp: string; // ISO 8601
  user_id?: string;
}

export function generateShareUrl(
  platform: SharePlatform,
  article: Article,
  articleUrl: string,
  customText?: string
): string {
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

export async function copyToClipboard(text: string): Promise<void> {
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
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    throw new Error("Failed to copy link", { cause: error });
  }
}

export function createShareEvent(
  article: Article,
  platform: SharePlatform,
  userId?: string
): ShareEvent {
  return {
    event_name: 'article_shared',
    article_id: article.id,
    article_title: article.title.en,
    platform,
    timestamp: new Date().toISOString(),
    user_id: userId,
  };
}

export function trackShareEvent(event: ShareEvent): void {
  // Track share event for analytics
  // This will be enhanced in Story 10.6
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
    const gtag = (window as unknown as Record<string, unknown>).gtag as (
      event: string,
      action: string,
      data: Record<string, unknown>
    ) => void;
    gtag('event', 'article_shared', {
      article_id: event.article_id,
      article_title: event.article_title,
      platform: event.platform,
      timestamp: event.timestamp,
      user_id: event.user_id,
    });
  }
}
