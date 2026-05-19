// Countdown timer module

const activeCountdowns = new Map();
let globalInterval = null;

/**
 * Start a countdown timer for a deadline
 * @param {Date} deadlineDate - UTC deadline date
 * @param {string} countdownId - Unique identifier for this countdown
 * @param {Function} onTick - Callback function called each second with { days, hours, minutes, seconds, urgency }
 * @param {Function} onExpired - Callback function called once when deadline passes
 * @returns {Object} Object with stop() method to cancel the countdown
 */
export function startCountdown(deadlineDate, countdownId, onTick, onExpired) {
  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
    return { stop: () => {} };
  }

  const countdownData = {
    deadlineDate,
    onTick,
    onExpired,
    expired: false
  };

  activeCountdowns.set(countdownId, countdownData);

  // Start global interval if not running
  if (!globalInterval) {
    globalInterval = setInterval(tickAllCountdowns, 1000);
  }

  // Call immediately for initial state
  tickCountdown(countdownId, countdownData);

  // Return stop function
  return {
    stop: () => {
      activeCountdowns.delete(countdownId);
      if (activeCountdowns.size === 0 && globalInterval) {
        clearInterval(globalInterval);
        globalInterval = null;
      }
    }
  };
}

/**
 * Tick all active countdowns
 */
function tickAllCountdowns() {
  for (const [id, data] of activeCountdowns) {
    if (!data.expired) {
      tickCountdown(id, data);
    }
  }
}

/**
 * Tick a single countdown
 */
function tickCountdown(id, countdownData) {
  const now = Date.now();
  const remainingMs = countdownData.deadlineDate.getTime() - now;
  const urgency = getUrgency(remainingMs);

  if (remainingMs <= 0 && !countdownData.expired) {
    countdownData.expired = true;
    if (countdownData.onExpired) {
      countdownData.onExpired();
    }
  }

  if (countdownData.onTick) {
    const { days, hours, minutes, seconds } = formatCountdown(remainingMs);
    countdownData.onTick({ days, hours, minutes, seconds, urgency });
  }
}

/**
 * Get the urgency level for remaining milliseconds
 * @param {number} remainingMs - Milliseconds until deadline
 * @returns {string} One of: 'past', 'urgent', 'warning', 'attention', 'normal'
 */
export function getUrgency(remainingMs) {
  if (remainingMs <= 0) return 'past';
  if (remainingMs <= 3 * 86400000) return 'urgent'; // 3 days
  if (remainingMs <= 7 * 86400000) return 'warning'; // 7 days
  if (remainingMs <= 30 * 86400000) return 'attention'; // 30 days
  return 'normal';
}

/**
 * Format remaining milliseconds into days, hours, minutes, seconds
 * @param {number} ms - Milliseconds
 * @returns {Object} { days, hours, minutes, seconds }
 */
function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Format countdown object to display string
 * @param {Object} countdown - { days, hours, minutes, seconds }
 * @returns {string} Formatted string like "12d 04h 33m 12s"
 */
export function formatCountdownString(countdown) {
  if (countdown.days > 0) {
    return `${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m`;
  } else if (countdown.hours > 0) {
    return `${countdown.hours}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
  } else {
    return `${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
  }
}

/**
 * Stop all active countdowns
 */
export function stopAllCountdowns() {
  activeCountdowns.clear();
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
}
