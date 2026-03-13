import { STAR_COLORS } from '@/lib/utils/color-scales';
import { cn } from '@/lib/utils';

interface StarRatingBadgeProps {
  rating: number | null | undefined;
  showLabel?: boolean;
  className?: string;
}

export function StarRatingBadge({ rating, showLabel = true, className }: StarRatingBadgeProps) {
  if (rating == null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Not rated</span>;
  }

  const color = STAR_COLORS[Math.min(5, Math.max(1, Math.round(rating)))] ?? '#94a3b8';
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span style={{ color, letterSpacing: '-1px' }}>{stars}</span>
      {showLabel && <span className="text-xs text-muted-foreground">{rating}/5</span>}
    </span>
  );
}
