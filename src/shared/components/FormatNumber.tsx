import React from 'react';

interface FormatNumberProps {
  /**
   * The number value to format
   */
  value: number | string | undefined | null;
  
  /**
   * Number of decimal places to show (default: 2)
   */
  decimalPlaces?: number;
  
  /**
   * Prefix to add before the number (e.g., "$", "€")
   */
  prefix?: string;
  
  /**
   * Suffix to add after the number (e.g., "%", " kg")
   */
  suffix?: string;
  
  /**
   * Whether to show thousands separators (default: true)
   */
  showSeparators?: boolean;
  
  /**
   * Custom className to apply to the formatted number
   */
  className?: string;
  
  /**
   * Custom style to apply to the formatted number
   */
  style?: React.CSSProperties;
}

/**
 * FormatNumber component for consistently formatting numeric values
 * with specified decimal places throughout the application
 */
export const FormatNumber: React.FC<FormatNumberProps> = ({
  value,
  decimalPlaces = 2,
  prefix = '',
  suffix = '',
  showSeparators = true,
  className,
  style,
}) => {
  // Handle undefined or null values
  if (value === undefined || value === null) {
    return <span className={className} style={style}>-</span>;
  }

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Check if the parsed value is a valid number
  if (isNaN(numValue)) {
    return <span className={className} style={style}>-</span>;
  }

  // Format the number with the specified decimal places
  const formattedValue = showSeparators
    ? numValue.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : numValue.toFixed(decimalPlaces);

  return (
    <span className={className} style={style}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default FormatNumber;
