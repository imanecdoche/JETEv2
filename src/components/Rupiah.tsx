import React from 'react';

interface RupiahProps {
  value: number;
  className?: string; // class applied to the outer span wrapper
  classNameValue?: string; // class applied to the inner numeric span
  classNameK?: string; // class applied to the "K" span
  classNameRp?: string; // class applied to the "Rp" span
}

/**
 * Formats a number to Indonesian Rupiah string with thousands replaced by 'K'
 * example: 3891000 -> "Rp 3.891K"
 */
export function formatRupiahString(num: number | undefined | null): string {
  if (num === undefined || num === null) return 'Rp 0';
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  if (absNum >= 1000) {
    const kValue = absNum / 1000;
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(kValue);
    return `${isNegative ? '-' : ''}Rp ${formatted}K`;
  } else {
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absNum);
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
  }
}

/**
 * React Component to display Rupiah format:
 * - Replaces last 3 digits of thousands with "K"
 * - Renders "Rp" as small and lower opacity
 * - Renders the numeric value as BOLD
 * - Renders the "K" suffix as regular (not bold)
 */
export default function Rupiah({
  value,
  className = "",
  classNameValue = "",
  classNameK = "font-normal text-[0.9em] ml-0.5",
  classNameRp = "text-[0.8em] opacity-70 mr-0.5 font-normal"
}: RupiahProps) {
  if (value === undefined || value === null || isNaN(value)) {
    return <span className={className}>-</span>;
  }

  const isNegative = value < 0;
  const absNum = Math.abs(value);
  const hasK = absNum >= 1000;
  const displayValue = hasK ? absNum / 1000 : absNum;
  
  const formattedText = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(displayValue);

  return (
    <span className={`inline-flex items-baseline font-sans ${className}`}>
      {isNegative && <span className="font-bold mr-0.5">-</span>}
      <span className={classNameRp}>Rp</span>
      <span className={`font-bold ${classNameValue}`}>{formattedText}</span>
      {hasK && <span className={classNameK}>K</span>}
    </span>
  );
}
