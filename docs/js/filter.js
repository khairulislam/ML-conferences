// Filter and sort state management module

const STORAGE_KEY = 'ml-conf-filter-state';

let state = {
  activeOnly: true,
  categories: new Set()
};

let onFilterChange = null;

/**
 * Initialize filter with local storage persistence
 * @param {Array} conferences - Full list of conferences
 * @param {Function} callback - Called with filtered list whenever state changes
 */
export function initFilter(conferences, callback) {
  onFilterChange = callback;

  // Load saved state from localStorage
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.activeOnly = parsed.activeOnly ?? true;
      state.categories = new Set(parsed.categories ?? []);
    } catch (error) {
      console.warn('Failed to parse saved filter state', error);
    }
  }

  // Initial filter
  if (callback) {
    callback(applyFilter(conferences, state));
  }
}

/**
 * Apply filter and sort to conferences
 * @param {Array} conferences - List of conferences
 * @param {Object} filterState - { activeOnly, categories }
 * @returns {Array} Filtered and sorted conferences
 */
export function applyFilter(conferences, filterState) {
  let filtered = conferences.slice();

  // Filter by active status
  if (filterState.activeOnly) {
    const now = Date.now();
    filtered = filtered.filter(conf => {
      if (!conf.paper_deadline_utc) return true; // TBD always shown
      const isExpired = conf.paper_deadline_utc.getTime() < now;
      return !isExpired;
    });
  }

  // Filter by category
  if (filterState.categories.size > 0) {
    filtered = filtered.filter(conf => filterState.categories.has(conf.category));
  }

  // Sort
  // 1. Separate future and past deadlines
  const now = Date.now();
  const future = [];
  const past = [];

  filtered.forEach(conf => {
    if (!conf.paper_deadline_utc) {
      future.push(conf); // TBD goes with future
    } else if (conf.paper_deadline_utc.getTime() >= now) {
      future.push(conf);
    } else {
      past.push(conf);
    }
  });

  // 2. Sort future by deadline ascending (soonest first)
  future.sort((a, b) => {
    if (!a.paper_deadline_utc) return 1; // TBD to end
    if (!b.paper_deadline_utc) return -1;
    return a.paper_deadline_utc.getTime() - b.paper_deadline_utc.getTime();
  });

  // 3. Sort past by deadline descending (most recent first)
  past.sort((a, b) => {
    if (!a.paper_deadline_utc) return 1;
    if (!b.paper_deadline_utc) return -1;
    return b.paper_deadline_utc.getTime() - a.paper_deadline_utc.getTime();
  });

  return [...future, ...past];
}

/**
 * Set active-only mode
 * @param {boolean} value - True to show only active deadlines
 */
export function setActiveOnly(value) {
  state.activeOnly = value;
  persistState();
  notifyChange();
}

/**
 * Set category filter
 * @param {Set|Array} categories - Set of category strings to show
 */
export function setCategoryFilter(categories) {
  state.categories = categories instanceof Set ? categories : new Set(categories);
  persistState();
  notifyChange();
}

/**
 * Get current filter state
 * @returns {Object} Current state { activeOnly, categories }
 */
export function getState() {
  return {
    activeOnly: state.activeOnly,
    categories: new Set(state.categories)
  };
}

/**
 * Persist state to localStorage and URL
 */
function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeOnly: state.activeOnly,
      categories: Array.from(state.categories)
    }));
  } catch (error) {
    console.warn('Failed to save filter state', error);
  }

  // Update URL params
  updateUrlParams();
}

/**
 * Update URL query parameters
 */
function updateUrlParams() {
  const params = new URLSearchParams();
  if (!state.activeOnly) {
    params.set('all', '1');
  }
  if (state.categories.size > 0) {
    params.set('cat', Array.from(state.categories).join(','));
  }

  const queryString = params.toString();
  const newUrl = queryString ? `?${queryString}` : window.location.pathname;
  history.replaceState({}, '', newUrl);
}

/**
 * Notify that filter state has changed
 */
function notifyChange() {
  // This is a bit of a hack - we'll call notifyChange from render.js after updateing state
  // The actual filtering is done in render.js which has access to the full conference list
}

/**
 * Get filtered conferences
 * @param {Array} allConferences - All conferences
 * @returns {Array} Filtered and sorted conferences
 */
export function getFilteredConferences(allConferences) {
  return applyFilter(allConferences, state);
}

/**
 * Check if categories filter is active
 * @returns {boolean} True if any category filter is selected
 */
export function hasCategoryFilter() {
  return state.categories.size > 0 && state.categories.size < 5; // 5 = total categories
}
