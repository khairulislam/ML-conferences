// Main application entry point

import { loadConferences } from './data.js';
import { getFilteredConferences, setActiveOnly, setCategoryFilter, getState } from './filter.js';
import { renderConferenceList, updateTimezoneInfo, stopAllCountdowns } from './render.js';

let allConferences = [];

/**
 * Initialize the application
 */
async function init() {
  // Load conferences
  allConferences = await loadConferences();

  if (allConferences.length === 0) {
    console.error('Failed to load conferences');
    return;
  }

  // Update timezone display
  updateTimezoneInfo();

  // Get DOM elements
  const listContainer = document.getElementById('conference-list');
  const toggleAll = document.getElementById('toggle-all');
  const toggleActive = document.getElementById('toggle-active');
  const chipElements = document.querySelectorAll('.chip input[type="checkbox"]');

  // Wire up toggle events
  toggleAll.addEventListener('change', () => {
    setActiveOnly(false);
    updateConferenceList();
  });

  toggleActive.addEventListener('change', () => {
    setActiveOnly(true);
    updateConferenceList();
  });

  // Wire up chip events
  chipElements.forEach(chip => {
    chip.addEventListener('change', () => {
      const selectedCategories = new Set();
      chipElements.forEach(c => {
        if (c.checked) {
          selectedCategories.add(c.value);
          c.parentElement.classList.add('chip--active');
        } else {
          c.parentElement.classList.remove('chip--active');
        }
      });
      setCategoryFilter(selectedCategories);
      updateConferenceList();
    });
  });

  // Load saved state and apply it to UI
  const state = getState();
  toggleActive.checked = state.activeOnly;
  toggleAll.checked = !state.activeOnly;

  chipElements.forEach(chip => {
    const isChecked = state.categories.has(chip.value);
    chip.checked = isChecked;
    if (isChecked) {
      chip.parentElement.classList.add('chip--active');
    } else {
      chip.parentElement.classList.remove('chip--active');
    }
  });

  // Initialize rendering after state is restored
  updateConferenceList();
}

/**
 * Update the conference list display
 */
function updateConferenceList() {
  const listContainer = document.getElementById('conference-list');
  const filtered = getFilteredConferences(allConferences);
  stopAllCountdowns();
  renderConferenceList(filtered, listContainer);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', stopAllCountdowns);
