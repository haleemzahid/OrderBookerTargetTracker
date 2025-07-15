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
 * Formats numeric values with proper validation and type conversion
 */
const formatNumericValue = (value: any): string | number => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    // Check if it's a decimal number
    if (numValue % 1 !== 0) {
      return Number(numValue.toFixed(2));
    }
    return numValue;
  }
  
  return value;
};

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
  // Handle undefined or null values using the formatNumericValue method
  const processedValue = formatNumericValue(value);
  
  if (processedValue === '') {
    return <span className={className} style={style}>-</span>;
  }

  // Convert to number for formatting
  const numValue = typeof processedValue === 'string' ? parseFloat(processedValue) : processedValue;

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
