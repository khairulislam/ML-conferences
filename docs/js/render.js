// DOM rendering module

import { startCountdown, formatCountdownString, getUrgency } from './countdown.js';
import { formatDateLocal, getUserTimezoneName } from './data.js';

const countdownIds = new Map();

/**
 * Render the complete conference list
 * @param {Array} conferences - Filtered and sorted conferences
 * @param {HTMLElement} container - DOM container to render into
 */
export function renderConferenceList(conferences, container) {
  // Clear previous countdowns
  countdownIds.forEach(id => id.stop && id.stop());
  countdownIds.clear();

  // Clear container
  container.innerHTML = '';

  if (conferences.length === 0) {
    renderEmptyState(container);
    return;
  }

  // Group conferences by status (future vs past)
  const now = Date.now();
  const futureConfs = conferences.filter(c => !c.paper_deadline_utc || c.paper_deadline_utc.getTime() >= now);
  const pastConfs = conferences.filter(c => c.paper_deadline_utc && c.paper_deadline_utc.getTime() < now);

  // Render future conferences
  futureConfs.forEach(conf => {
    const card = renderCard(conf);
    container.appendChild(card);
  });

  // Add past section if there are past conferences
  if (pastConfs.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'past-section-label';
    separator.textContent = 'Past Deadlines';
    container.appendChild(separator);

    pastConfs.forEach(conf => {
      const card = renderCard(conf);
      container.appendChild(card);
    });
  }
}

/**
 * Render a single conference card
 * @param {Object} conference - Conference object
 * @returns {HTMLElement} Card element
 */
export function renderCard(conference) {
  const card = document.createElement('article');
  card.className = 'card conference-card';
  card.dataset.conferenceId = `${conference.name}-${conference.year}`;

  // Left side
  const left = document.createElement('div');
  left.className = 'conference-card-left';

  // Header row
  const header = document.createElement('div');
  header.className = 'conference-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.style.display = 'flex';
  titleGroup.style.alignItems = 'baseline';
  titleGroup.style.gap = 'var(--space-3)';
  titleGroup.style.flexWrap = 'wrap';

  const name = document.createElement('h3');
  name.className = 'conference-name';
  name.textContent = conference.name;
  titleGroup.appendChild(name);

  const year = document.createElement('span');
  year.className = 'conference-year';
  year.textContent = conference.year;
  titleGroup.appendChild(year);

  // Category badge
  const badge = document.createElement('span');
  badge.className = `badge badge--${conference.category.toLowerCase()}`;
  badge.textContent = conference.category;
  titleGroup.appendChild(badge);

  header.appendChild(titleGroup);

  // External link icon
  const linkIcon = document.createElement('a');
  linkIcon.href = conference.homepage;
  linkIcon.target = '_blank';
  linkIcon.rel = 'noopener noreferrer';
  linkIcon.className = 'conference-external-link';
  linkIcon.title = 'Visit conference website';
  linkIcon.innerHTML = '🔗';
  linkIcon.style.marginLeft = 'auto';
  header.appendChild(linkIcon);

  left.appendChild(header);

  // Meta row (dates and deadlines)
  const meta = document.createElement('div');
  meta.className = 'conference-meta';

  // Dates and location
  const datesLoc = document.createElement('div');
  datesLoc.className = 'conference-dates-location';

  const dates = document.createElement('span');
  dates.className = 'conference-dates';
  dates.textContent = `${conference.conf_start} to ${conference.conf_end}`;
  datesLoc.appendChild(dates);

  const loc = document.createElement('span');
  loc.className = 'conference-location';
  loc.textContent = `📍 ${conference.location}`;
  datesLoc.appendChild(loc);

  meta.appendChild(datesLoc);

  // Deadlines
  const deadlines = document.createElement('div');
  deadlines.className = 'conference-deadlines';

  if (conference.abstract_deadline) {
    const absDeadline = document.createElement('div');
    absDeadline.className = 'deadline-item';

    const absLabel = document.createElement('span');
    absLabel.className = 'deadline-label';
    absLabel.textContent = 'Abstract';
    absDeadline.appendChild(absLabel);

    const absDate = document.createElement('span');
    absDate.className = 'deadline-value';
    absDate.textContent = formatDateLocal(conference.abstract_deadline_utc);
    absDeadline.appendChild(absDate);

    deadlines.appendChild(absDeadline);
  }

  const paperDeadline = document.createElement('div');
  paperDeadline.className = 'deadline-item';

  const paperLabel = document.createElement('span');
  paperLabel.className = 'deadline-label';
  paperLabel.textContent = 'Paper';
  paperDeadline.appendChild(paperLabel);

  const paperDate = document.createElement('span');
  paperDate.className = 'deadline-value';
  paperDate.textContent = formatDateLocal(conference.paper_deadline_utc);
  paperDeadline.appendChild(paperDate);

  deadlines.appendChild(paperDeadline);

  meta.appendChild(deadlines);
  left.appendChild(meta);

  card.appendChild(left);

  // Right side - countdown
  const right = document.createElement('div');
  right.className = 'conference-card-right';

  const countdownEl = document.createElement('div');
  countdownEl.className = 'countdown-timer';
  countdownEl.dataset.deadlineMs = conference.paper_deadline_utc ? conference.paper_deadline_utc.getTime() : null;

  const countdownId = `${conference.name}-${conference.year}-${Date.now()}`;

  if (conference.paper_deadline_utc && !isNaN(conference.paper_deadline_utc.getTime())) {
    // Start countdown
    const countdown = startCountdown(
      conference.paper_deadline_utc,
      countdownId,
      (tickData) => {
        const text = formatCountdownString(tickData);
        countdownEl.textContent = text;
        countdownEl.className = `countdown-timer countdown-timer--${tickData.urgency}`;
        updateCardUrgency(card, tickData.urgency);
      },
      () => {
        countdownEl.textContent = 'Expired';
        countdownEl.className = 'countdown-timer countdown-timer--past';
        updateCardUrgency(card, 'past');
      }
    );

    countdownIds.set(countdownId, countdown);
  } else {
    countdownEl.textContent = 'TBD';
    countdownEl.className = 'countdown-timer countdown-timer-tbd';
  }

  right.appendChild(countdownEl);
  card.appendChild(right);

  // Set initial urgency class on card
  if (conference.paper_deadline_utc) {
    const urgency = getUrgency(conference.paper_deadline_utc.getTime() - Date.now());
    card.classList.add(`card--${urgency}`);
  }

  return card;
}

/**
 * Update card urgency styling
 * @param {HTMLElement} card - Card element
 * @param {string} urgency - Urgency level
 */
function updateCardUrgency(card, urgency) {
  // Remove all urgency classes
  card.classList.remove('card--normal', 'card--attention', 'card--warning', 'card--urgent', 'card--past');
  // Add current class
  card.classList.add(`card--${urgency}`);
}

/**
 * Render empty state
 * @param {HTMLElement} container - DOM container
 */
export function renderEmptyState(container) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.textContent = '🔍';
  empty.appendChild(icon);

  const title = document.createElement('h3');
  title.className = 'empty-state-title';
  title.textContent = 'No conferences found';
  empty.appendChild(title);

  const text = document.createElement('p');
  text.className = 'empty-state-text';
  text.textContent = 'Try adjusting your filters to see more conferences.';
  empty.appendChild(text);

  container.appendChild(empty);
}

/**
 * Update timezone display
 */
export function updateTimezoneInfo() {
  const tzInfo = document.getElementById('timezone-info');
  if (tzInfo) {
    const tz = getUserTimezoneName();
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMins = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    tzInfo.textContent = `Times in your local timezone (${tz}, UTC${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')})`;
  }
}

/**
 * Stop all countdowns
 */
export function stopAllCountdowns() {
  countdownIds.forEach(countdown => countdown.stop());
  countdownIds.clear();
}
