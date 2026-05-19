// Data loading and parsing module

const timezoneOffsetCache = new Map();

/**
 * Load conferences from CSV file
 * @returns {Promise<Array>} Array of conference objects
 */
export async function loadConferences() {
  try {
    const response = await fetch('./data/conferences.csv');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error('Error loading conferences:', error);
    return [];
  }
}

/**
 * Parse CSV text into conference objects
 * @param {string} text - Raw CSV text
 * @returns {Array} Array of conference objects
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 1) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const conferences = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    // Normalize dates
    if (obj.abstract_deadline) {
      obj.abstract_deadline_utc = normalizeDeadline(obj.abstract_deadline, obj.deadline_timezone);
    } else {
      obj.abstract_deadline_utc = null;
    }

    if (obj.paper_deadline) {
      obj.paper_deadline_utc = normalizeDeadline(obj.paper_deadline, obj.deadline_timezone);
    } else {
      obj.paper_deadline_utc = null;
    }

    conferences.push(obj);
  }

  return conferences;
}

/**
 * Parse a single CSV line, handling quoted fields
 * @param {string} line - CSV line
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Normalize a deadline string to UTC Date object
 * Handles ISO 8601 strings with timezone offset notation
 *
 * @param {string} isoString - ISO 8601 datetime string (e.g., "2026-05-06T23:59:00")
 * @param {string} timezone - Timezone string (e.g., "UTC-12", "UTC+5:30")
 * @returns {Date} UTC Date object representing the deadline
 */
export function normalizeDeadline(isoString, timezone) {
  if (!isoString) return null;

  try {
    // Default to UTC-12 (Anywhere on Earth / AoE) if no timezone provided
    const tz = (timezone || 'UTC-12').trim();

    // Parse the ISO string as if it were UTC
    const utcMs = new Date(isoString + 'Z').getTime();

    // Get the offset for this timezone
    const offsetMinutes = getTimezoneOffset(tz);

    // Subtract the offset to get the true UTC time
    // If deadline is at 23:59 UTC-12, the UTC time is 23:59 + 12 hours
    const deadlineUtcMs = utcMs - (offsetMinutes * 60000);

    return new Date(deadlineUtcMs);
  } catch (error) {
    console.warn(`Failed to normalize deadline: ${isoString} ${timezone}`, error);
    return null;
  }
}

/**
 * Get timezone offset in minutes
 * Handles both UTC±N notation and IANA timezone names
 *
 * @param {string} tz - Timezone string (e.g., "UTC-12", "UTC+5:30", "America/New_York")
 * @returns {number} Offset in minutes (positive = ahead of UTC)
 */
export function getTimezoneOffset(tz) {
  // Check cache first
  if (timezoneOffsetCache.has(tz)) {
    return timezoneOffsetCache.get(tz);
  }

  let offsetMinutes = 0;

  // Try UTC±N notation first
  const utcMatch = tz.match(/^UTC([+-])(\d+)(?::(\d+))?$/i);
  if (utcMatch) {
    const sign = utcMatch[1] === '+' ? 1 : -1;
    const hours = parseInt(utcMatch[2], 10);
    const mins = parseInt(utcMatch[3] || 0, 10);
    offsetMinutes = sign * (hours * 60 + mins);
  } else {
    // Try IANA timezone name using Intl API
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const parts = formatter.formatToParts(now);
      const localDate = new Date(
        parseInt(parts.find(p => p.type === 'year').value, 10),
        parseInt(parts.find(p => p.type === 'month').value, 10) - 1,
        parseInt(parts.find(p => p.type === 'day').value, 10),
        parseInt(parts.find(p => p.type === 'hour').value, 10),
        parseInt(parts.find(p => p.type === 'minute').value, 10),
        parseInt(parts.find(p => p.type === 'second').value, 10)
      );

      offsetMinutes = Math.round((now.getTime() - localDate.getTime()) / 60000);
    } catch (error) {
      console.warn(`Unknown timezone: ${tz}, defaulting to UTC-12`);
      offsetMinutes = -720; // UTC-12
    }
  }

  timezoneOffsetCache.set(tz, offsetMinutes);
  return offsetMinutes;
}

/**
 * Get user's local timezone offset in minutes
 * @returns {number} Offset in minutes (negative for west of UTC)
 */
export function getUserTimezoneOffset() {
  return new Date().getTimezoneOffset() * -1;
}

/**
 * Get user's timezone name
 * @returns {string} IANA timezone name (e.g., "America/New_York")
 */
export function getUserTimezoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Format a Date object to local timezone string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDateLocal(date) {
  if (!date || isNaN(date.getTime())) return 'TBD';

  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'TBD';
  }
}

/**
 * Format a Date object to local time with timezone
 * @param {Date} date - Date object
 * @returns {string} Formatted datetime string
 */
export function formatDateTimeLocal(date) {
  if (!date || isNaN(date.getTime())) return 'TBD';

  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'TBD';
  }
}
