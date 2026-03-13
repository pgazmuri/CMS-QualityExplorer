'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { getMeasureInfo, type MeasureEntry } from '@/lib/data/measure-glossary';

interface InfoTooltipProps {
  /** Look up tooltip text from the measure glossary by key */
  measureId?: string;
  /** Or provide custom tooltip text directly */
  text?: string;
  /** Custom interpretation line */
  interpretation?: string;
  /** Override the About page anchor link */
  aboutAnchor?: string;
  /** Which side to show the tooltip */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Icon size in pixels */
  size?: number;
}

export function InfoTooltip({
  measureId,
  text,
  interpretation,
  aboutAnchor,
  side = 'top',
  size = 14,
}: InfoTooltipProps) {
  let entry: MeasureEntry | undefined;
  if (measureId) {
    entry = getMeasureInfo(measureId);
  }

  const description = text ?? entry?.shortDescription;
  const interp = interpretation ?? entry?.interpretation;
  const anchor = aboutAnchor ?? entry?.aboutAnchor;

  if (!description) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help align-middle ml-1"
        aria-label="More information"
      >
        <Info style={{ width: size, height: size }} />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-left">
        <div className="space-y-1">
          {entry?.label && (
            <p className="font-semibold text-xs">{entry.label}</p>
          )}
          <p className="text-xs leading-relaxed">{description}</p>
          {interp && (
            <p className="text-xs leading-relaxed opacity-80 italic">{interp}</p>
          )}
          {anchor && (
            <Link
              href={`/about#${anchor}`}
              className="text-xs text-blue-400 hover:text-blue-300 underline block mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more →
            </Link>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
