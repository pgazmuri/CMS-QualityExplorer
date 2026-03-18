import Link from 'next/link';
import { MapPin, Phone, Activity } from 'lucide-react';
import { StarRatingBadge } from './StarRatingBadge';
import { cn } from '@/lib/utils';
import type { HospitalSearchResult } from '@/lib/duckdb/queries/hospitals';

interface HospitalCardProps {
  hospital: HospitalSearchResult;
  className?: string;
}

export function HospitalCard({ hospital, className }: HospitalCardProps) {
  return (
    <Link
      href={`/dashboards/hospital-compass/${hospital.facility_id}`}
      className={cn(
        'block rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer',
        className
      )}
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{hospital.facility_name}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{[hospital.city, hospital.state, hospital.zip].filter(Boolean).join(', ')}</span>
          </div>
          {hospital.hospital_type && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
              {hospital.hospital_type}
            </p>
          )}
        </div>
        <StarRatingBadge rating={hospital.star_rating} showLabel={false} />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {hospital.emergency_services === 'Yes' && (
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-red-500" />
            <span>Emergency</span>
          </span>
        )}
        {hospital.distance_miles != null && (
          <span className="flex items-center gap-1 text-blue-500 font-medium">
            {hospital.distance_miles} mi
          </span>
        )}
        <span className="ml-auto font-mono text-xs opacity-60">{hospital.facility_id}</span>
      </div>
    </Link>
  );
}
