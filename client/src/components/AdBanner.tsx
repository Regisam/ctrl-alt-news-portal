// AdBanner — Reusable Google AdSense Leaderboard 728×90 placeholder
// Responsive: scales down on mobile, maintains aspect ratio

interface AdBannerProps {
  marginBottom?: string;
  marginTop?: string;
  ariaLabel?: string;
}

export default function AdBanner({
  marginBottom = '48px',
  marginTop = '0',
  ariaLabel = 'Advertisement',
}: AdBannerProps) {
  return (
    <div
      style={{
        maxWidth: '728px',
        margin: `${marginTop} auto ${marginBottom}`,
        aspectRatio: '728 / 90',
        border: '1px dashed rgba(255,255,255,0.12)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,5,6,0.6)',
        color: 'rgba(255,255,255,0.25)',
        fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
        letterSpacing: '0.15em',
        fontFamily: "'Roboto Mono', monospace",
        textTransform: 'uppercase',
        fontWeight: 500,
      }}
      aria-label={ariaLabel}
      role="complementary"
    >
      Google AdSense — Leaderboard 728×90
    </div>
  );
}
