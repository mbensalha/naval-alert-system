
/**
 * Formats decimal coordinates to degrees and minutes format
 * @param coordinate The decimal coordinate value
 * @param isLatitude Whether this is a latitude coordinate (true) or longitude (false)
 * @returns Formatted coordinate string like N37°08.557' or E10°34.691'
 */
export const formatCoordinate = (coordinate: number, isLatitude: boolean): string => {
  // Determine hemisphere
  const hemisphere = isLatitude 
    ? coordinate >= 0 ? 'N' : 'S'
    : coordinate >= 0 ? 'E' : 'W';
  
  // Use absolute value for calculations
  const absCoordinate = Math.abs(coordinate);
  
  // Calculate degrees (integer part)
  const degrees = Math.floor(absCoordinate);
  
  // Calculate minutes (decimal part * 60)
  const minutesDecimal = (absCoordinate - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  
  // Calculate decimal minutes (3 decimal places)
  const decimalMinutes = Math.round((minutesDecimal - minutes) * 1000) / 1000;
  
  // Format the final string with padding for minutes
  return `${hemisphere}${degrees}°${minutes.toString().padStart(2, '0')}.${(decimalMinutes * 1000).toFixed(0).padStart(3, '0')}'`;
};

/**
 * Converts speed from km/h to mph
 * @param kmh Speed in kilometers per hour
 * @returns Speed in miles per hour
 */
export const kmhToMph = (kmh: number): number => {
  return kmh * 0.621371;
};
