// Statistics page module

import { parseCSV } from './data.js';

let allStats = [];
let filteredStats = [];
let selectedConferences = new Map(); // conference -> color level (0-4)
let selectedCategory = null; // will be set to first category after loading data
let uniqueCategories = []; // populated from CSV
let categoryColors = new Map(); // category -> color, assigned dynamically

// Color palette for categories (reused cyclically)
const colorPalette = [
  '#7c4dff', // purple
  '#00bcd4', // cyan
  '#4caf50', // green
  '#ff7043', // orange
  '#f06292', // pink
  '#9c27b0', // deep purple
  '#ff5722', // deep orange
  '#2196f3', // blue
  '#009688', // teal
  '#e91e63', // magenta
  '#ffc107', // amber
  '#3f51b5', // indigo
  '#f44336', // red
  '#673ab7'  // indigo deep
];

const MAX_CONFERENCE_SELECTIONS = 1;

/**
 * Reassign color levels to all selected conferences based on insertion order
 */
function reassignColorLevels() {
  let level = 0;
  for (const conf of selectedConferences.keys()) {
    selectedConferences.set(conf, level);
    level++;
  }
}

/**
 * Initialize categories from loaded stats
 */
function initializeCategories() {
  uniqueCategories = [...new Set(allStats.map(s => s.category))].sort();
  categoryColors.clear();
  uniqueCategories.forEach((cat, idx) => {
    categoryColors.set(cat, colorPalette[idx % colorPalette.length]);
  });

  selectedCategory = null; // Start with "All" categories
}

/**
 * Load acceptance rates from two normalized CSVs and merge them
 */
export async function loadAcceptanceRates() {
  try {
    // Load conferences metadata
    console.log('Loading conferences_metadata.csv');
    const metaResponse = await fetch('./data/conferences_metadata.csv');
    if (!metaResponse.ok) {
      throw new Error(`HTTP ${metaResponse.status}: ${metaResponse.statusText}`);
    }
    const metaText = await metaResponse.text();
    const metaParsed = parseCSV(metaText);
    console.log('Parsed metadata:', metaParsed.length, 'conferences');

    // Create metadata map for fast lookup
    const metadataMap = new Map();
    metaParsed.forEach(row => {
      metadataMap.set(row.conference, {
        full_name: row.full_name,
        main_discipline: row.main_discipline,
        other_disciplines: row.other_disciplines,
        organization: row.organization,
        website: row.website,
        category: row.category
      });
    });

    // Load yearly acceptance rates
    console.log('Loading acceptance_rates_yearly.csv');
    const yearlyResponse = await fetch('./data/acceptance_rates_yearly.csv');
    if (!yearlyResponse.ok) {
      throw new Error(`HTTP ${yearlyResponse.status}: ${yearlyResponse.statusText}`);
    }
    const yearlyText = await yearlyResponse.text();
    const yearlyParsed = parseCSV(yearlyText);
    console.log('Parsed yearly data:', yearlyParsed.length, 'entries');

    // Merge yearly data with metadata
    const result = yearlyParsed.map(row => {
      const metadata = metadataMap.get(row.conference) || {};
      return {
        conference: row.conference,
        full_name: metadata.full_name || '',
        year: parseInt(row.year),
        ordinal: row.ordinal,
        location: row.location,
        category: metadata.category || '',
        submissions: parseInt(row.submissions),
        accepted: parseInt(row.accepted),
        acceptance_rate: parseFloat(row.acceptance_rate),
        main_discipline: metadata.main_discipline || '',
        other_disciplines: metadata.other_disciplines || '',
        organization: metadata.organization || '',
        website: metadata.website || ''
      };
    });
    console.log('Merged to', result.length, 'stats objects');
    return result;
  } catch (error) {
    console.error('Failed to load acceptance rates:', error);
    return [];
  }
}

/**
 * Filter stats by year range
 */
function filterByYear(stats, minYear, maxYear) {
  return stats.filter(s => s.year >= minYear && s.year <= maxYear);
}

/**
 * Get unique conferences from stats
 */
function getUniqueConferences(stats) {
  return [...new Set(stats.map(s => s.conference))];
}

/**
 * Convert category name to valid CSS class name
 */
function getCategoryClassName(category) {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Get category color
 */
function getCategoryColor(category) {
  if (category === null) return 'var(--color-accent)';
  return categoryColors.get(category) || 'var(--color-accent)';
}

/**
 * Filter stats by selected category (exclusive)
 */
function filterByCategory(stats, category) {
  if (category === null) {
    console.log(`Showing all categories: ${stats.length} stats`);
    return stats;
  }
  const result = stats.filter(s => s.category === category);
  console.log(`Filtering by category "${category}": ${stats.length} input → ${result.length} output`);
  return result;
}

/**
 * Sort stats based on sort key
 */
function sortStats(stats, sortKey) {
  const sorted = [...stats];

  switch (sortKey) {
    case 'rate-desc':
      sorted.sort((a, b) => b.acceptance_rate - a.acceptance_rate);
      break;
    case 'rate-asc':
      sorted.sort((a, b) => a.acceptance_rate - b.acceptance_rate);
      break;
    case 'year-desc':
      sorted.sort((a, b) => b.year - a.year || b.acceptance_rate - a.acceptance_rate);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.conference.localeCompare(b.conference) || b.year - a.year);
      break;
  }

  return sorted;
}

/**
 * Render stats cards
 */
function renderStatsCards(stats, container) {
  container.innerHTML = '';

  if (stats.length === 0) {
    document.getElementById('empty-state').style.display = 'flex';
    return;
  }

  document.getElementById('empty-state').style.display = 'none';

  // Group by conference and keep only latest year
  const latestPerConference = new Map();
  stats.forEach(stat => {
    const existing = latestPerConference.get(stat.conference);
    if (!existing || stat.year > existing.year) {
      latestPerConference.set(stat.conference, stat);
    }
  });

  const uniqueStats = Array.from(latestPerConference.values());

  uniqueStats.forEach(stat => {
    const card = document.createElement('div');
    card.className = `stats-card`;
    const categoryColor = getCategoryColor(stat.category);
    card.style.borderLeftColor = categoryColor;

    const header = document.createElement('div');
    header.className = 'stats-card-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'stats-card-title';

    const name = document.createElement('h3');
    name.className = 'stats-card-name';
    name.textContent = stat.conference;
    titleGroup.appendChild(name);

    const year = document.createElement('span');
    year.className = 'stats-card-year';
    year.textContent = stat.year;
    titleGroup.appendChild(year);

    header.appendChild(titleGroup);

    const rate = document.createElement('div');
    rate.className = 'stats-card-rate';
    rate.textContent = `${stat.acceptance_rate.toFixed(1)}%`;
    header.appendChild(rate);

    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'stats-card-body';

    const meta = document.createElement('div');
    meta.className = 'stats-card-meta';
    meta.innerHTML = `
      <span>Submissions: ${stat.submissions.toLocaleString()}</span>
      <span>Accepted: ${stat.accepted.toLocaleString()}</span>
    `;
    body.appendChild(meta);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'stats-progress-container';

    const progressLabel = document.createElement('div');
    progressLabel.className = 'stats-progress-label';
    progressLabel.textContent = 'Acceptance Rate';
    progressContainer.appendChild(progressLabel);

    const progressBar = document.createElement('div');
    progressBar.className = 'stats-progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'stats-progress-fill';
    progressFill.style.width = `${stat.acceptance_rate}%`;
    progressFill.style.backgroundColor = categoryColor;
    progressBar.appendChild(progressFill);

    progressContainer.appendChild(progressBar);
    body.appendChild(progressContainer);

    card.appendChild(body);
    container.appendChild(card);
  });
}

/**
 * Set canvas dimensions based on container
 */
function resizeCanvas(canvas) {
  if (!canvas) return;
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(rect.width - 16, 300) * dpr;
  canvas.height = 400 * dpr;

  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(dpr, dpr);
}

/**
 * Render trend chart with canvas - combo chart (bars + line)
 */
function renderTrendChart(filteredStats, canvas) {
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  console.log('Rendering chart with', filteredStats.length, 'stats');

  resizeCanvas(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  console.log('Device pixel ratio:', dpr, 'Canvas size:', canvas.width, 'x', canvas.height);

  // Only show chart if one conference is selected
  if (selectedConferences.size === 0) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const legend = document.getElementById('chart-legend');
    legend.innerHTML = '';
    return;
  }

  // Get the selected conference (single selection)
  const selectedConf = Array.from(selectedConferences.keys())[0];
  const confStats = filteredStats.filter(s => s.conference === selectedConf).sort((a, b) => a.year - b.year);

  if (confStats.length === 0) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const legend = document.getElementById('chart-legend');
    legend.innerHTML = '';
    return;
  }

  // Get year range
  const allYears = confStats.map(s => s.year).sort((a, b) => a - b);
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);

  // Get max values for scaling
  const maxSubmissions = Math.max(...confStats.map(s => s.submissions));
  // Dynamic ymax: round up to nearest 10%
  const maxRate = Math.ceil(Math.max(...confStats.map(s => s.acceptance_rate)) / 10) * 10;

  // Chart dimensions
  const padding = 80;
  const width = (canvas.width / dpr) - padding * 2;
  const height = (canvas.height / dpr) - padding * 2;

  // Clear canvas
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  // Draw dual axes
  drawDualAxes(ctx, canvas, padding, width, height, minYear, maxYear, allYears, maxSubmissions, maxRate);

  // Draw bars (accepted in orange, rejected in dark blue)
  drawBars(ctx, confStats, allYears, minYear, maxYear, padding, width, height, maxSubmissions);

  // Draw line (acceptance rate in line color)
  drawAcceptanceRateLine(ctx, confStats, allYears, minYear, maxYear, padding, width, height, maxRate, canvas);

  // Setup hover tooltip
  setupChartHover(canvas, confStats, selectedConf, () => {
    // Redraw function to be called when we need to redraw with tooltip
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawDualAxes(ctx, canvas, padding, width, height, minYear, maxYear, allYears, maxSubmissions, maxRate);
    drawBars(ctx, confStats, allYears, minYear, maxYear, padding, width, height, maxSubmissions);
    drawAcceptanceRateLine(ctx, confStats, allYears, minYear, maxYear, padding, width, height, maxRate, canvas);
    if (canvas._hoveredPoint) {
      drawTooltip(ctx, canvas, canvas._hoveredPoint, selectedConf);
    }
  });

  // Update legend
  updateComboLegend(selectedConf);
}

/**
 * Draw dual axes and grid (left for counts, right for rate)
 */
function drawDualAxes(ctx, canvas, padding, width, height, minYear, maxYear, years, maxSubmissions, maxRate = 100) {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim();
  ctx.lineWidth = 1;
  ctx.font = '16px system-ui';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();
  ctx.textAlign = 'center';

  const dpr = window.devicePixelRatio || 1;
  const renderHeight = canvas.height / dpr;
  const renderWidth = canvas.width / dpr;

  // Horizontal grid and labels (years)
  const yearStep = Math.ceil((maxYear - minYear) / 4);
  for (let year = minYear; year <= maxYear; year += yearStep) {
    const x = padding + ((year - minYear) / (maxYear - minYear)) * width;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + height);
    ctx.stroke();
    ctx.fillText(year, x, renderHeight - 20);
  }

  // Left Y-axis labels (submission counts)
  ctx.textAlign = 'right';
  const submissionStep = Math.ceil(maxSubmissions / 5 / 1000) * 1000; // Round to nearest 1000
  for (let submissions = 0; submissions <= maxSubmissions; submissions += submissionStep) {
    const y = padding + height - (submissions / maxSubmissions) * height;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + width, y);
    ctx.stroke();
    ctx.fillText(`${(submissions / 1000).toFixed(0)}k`, padding - 10, y + 4);
  }

  // Right Y-axis labels (acceptance rate %)
  ctx.textAlign = 'left';
  const rateStep = 10;
  for (let rate = 0; rate <= maxRate; rate += rateStep) {
    const y = padding + height - (rate / maxRate) * height;
    ctx.fillText(`${rate}%`, renderWidth - padding + 10, y + 4);
  }

  // Axes
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + height);
  ctx.lineTo(padding + width, padding + height);
  ctx.stroke();

  // Right Y-axis
  ctx.beginPath();
  ctx.moveTo(padding + width, padding);
  ctx.lineTo(padding + width, padding + height);
  ctx.stroke();
}

/**
 * Draw stacked bars for accepted and rejected
 */
function drawBars(ctx, stats, allYears, minYear, maxYear, padding, width, height, maxSubmissions) {
  const barWidth = width / (allYears.length * 1.5);

  stats.forEach(stat => {
    const yearIndex = allYears.indexOf(stat.year);
    if (yearIndex === -1) return;

    const x = padding + ((yearIndex + 0.5) / allYears.length) * width - barWidth / 2;

    // Accepted bar (green)
    const acceptedHeight = (stat.accepted / maxSubmissions) * height;
    const acceptedY = padding + height - acceptedHeight;
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x, acceptedY, barWidth, acceptedHeight);

    // Rejected bar (light red) - stacked on top
    const rejectedCount = stat.submissions - stat.accepted;
    const rejectedHeight = (rejectedCount / maxSubmissions) * height;
    const rejectedY = acceptedY - rejectedHeight;
    ctx.fillStyle = '#974343';
    ctx.fillRect(x, rejectedY, barWidth, rejectedHeight);
  });
}

/**
 * Draw tooltip for hovered point
 */
function drawTooltip(ctx, canvas, point, conferenceDisplayName) {
  if (!point) return;

  const dpr = window.devicePixelRatio || 1;
  const stat = point.stat;
  const rejectedCount = stat.submissions - stat.accepted;
  const renderWidth = canvas.width / dpr;
  const renderHeight = canvas.height / dpr;

  const tooltipWidth = 340;
  const tooltipHeight = 170;

  // Position below the mouse point, centered horizontally
  let tx = point.x - tooltipWidth / 2;
  let ty = point.y + 20;

  // Adjust if off-screen horizontally
  if (tx < 0) {
    tx = 10;
  }
  if (tx + tooltipWidth > renderWidth) {
    tx = renderWidth - tooltipWidth - 10;
  }

  // Adjust if off-screen vertically (move above the point)
  if (ty + tooltipHeight > renderHeight) {
    ty = point.y - tooltipHeight - 20;
  }

  // Draw tooltip background
  const radius = 8;
  ctx.fillStyle = 'rgba(15, 17, 23, 0.98)';
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx + radius, ty);
  ctx.lineTo(tx + tooltipWidth - radius, ty);
  ctx.arcTo(tx + tooltipWidth, ty, tx + tooltipWidth, ty + radius, radius);
  ctx.lineTo(tx + tooltipWidth, ty + tooltipHeight - radius);
  ctx.arcTo(tx + tooltipWidth, ty + tooltipHeight, tx + tooltipWidth - radius, ty + tooltipHeight, radius);
  ctx.lineTo(tx + radius, ty + tooltipHeight);
  ctx.arcTo(tx, ty + tooltipHeight, tx, ty + tooltipHeight - radius, radius);
  ctx.lineTo(tx, ty + radius);
  ctx.arcTo(tx, ty, tx + radius, ty, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw tooltip text with different colors for labels and numbers
  const labelColor = '#5c6bc0'; // blue
  const numberColor = '#ff9800'; // orange

  // Helper function to draw text with label and value in different colors
  const drawLabelValue = (label, value, y, isBold = false) => {
    ctx.font = (isBold ? 'bold ' : '') + '15px system-ui';
    const labelText = label + ': ';

    // Draw label in blue
    ctx.fillStyle = labelColor;
    ctx.fillText(labelText, tx + 15, y);

    // Measure label width and draw value in orange
    const labelWidth = ctx.measureText(labelText).width;
    ctx.fillStyle = numberColor;
    ctx.fillText(value, tx + 15 + labelWidth, y);
  };

  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  drawLabelValue('Year', `${stat.year}`, ty + 28, true);

  drawLabelValue('Number of Accepted', stat.accepted.toLocaleString(), ty + 52);
  drawLabelValue('Number of Rejected', rejectedCount.toLocaleString(), ty + 74);
  drawLabelValue('Number of Submissions', stat.submissions.toLocaleString(), ty + 96);
  drawLabelValue('Acceptance Rate', `${stat.acceptance_rate.toFixed(1)}%`, ty + 118);
  drawLabelValue('Location', stat.location, ty + 140);

  // Highlight point
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Draw acceptance rate line
 */
function drawAcceptanceRateLine(ctx, stats, allYears, minYear, maxYear, padding, width, height, maxRate = 100, canvas = null) {
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  let firstPoint = true;
  stats.forEach(stat => {
    const yearIndex = allYears.indexOf(stat.year);
    if (yearIndex !== -1) {
      const x = padding + ((yearIndex + 0.5) / allYears.length) * width;
      const y = padding + height - (stat.acceptance_rate / maxRate) * height;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
  });

  ctx.stroke();

  // Draw circles at each point
  ctx.fillStyle = '#4caf50';
  stats.forEach(stat => {
    const yearIndex = allYears.indexOf(stat.year);
    if (yearIndex !== -1) {
      const x = padding + ((yearIndex + 0.5) / allYears.length) * width;
      const y = padding + height - (stat.acceptance_rate / maxRate) * height;

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Store data points for hover detection
  canvas.chartDataPoints = stats.map((stat, idx) => {
    const yearIndex = allYears.indexOf(stat.year);
    if (yearIndex !== -1) {
      const x = padding + ((yearIndex + 0.5) / allYears.length) * width;
      const y = padding + height - (stat.acceptance_rate / maxRate) * height;
      return { x, y, stat };
    }
    return null;
  }).filter(p => p !== null);

  // Store chart metadata
  canvas.chartMetadata = { padding, width, height, maxRate };
}

/**
 * Setup hover tooltip for chart
 */
function setupChartHover(canvas, chartStats, conferenceDisplayName, redrawFn) {
  if (!canvas) return;

  // Remove old listeners if they exist
  if (canvas._hoverHandler) {
    canvas.removeEventListener('mousemove', canvas._hoverHandler);
  }
  if (canvas._leaveHandler) {
    canvas.removeEventListener('mouseleave', canvas._leaveHandler);
  }

  canvas._hoverHandler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (!canvas.chartDataPoints || canvas.chartDataPoints.length === 0) {
      return;
    }

    // Find closest data point within threshold
    let closest = null;
    let minDist = 100;
    for (const point of canvas.chartDataPoints) {
      const dist = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    const wasHovered = !!canvas._hoveredPoint;
    canvas._hoveredPoint = closest;

    // Redraw if hover state changed
    if (closest !== null || wasHovered) {
      redrawFn();
    }
  };

  canvas._leaveHandler = () => {
    if (canvas._hoveredPoint) {
      canvas._hoveredPoint = null;
      redrawFn();
    }
  };

  canvas.addEventListener('mousemove', canvas._hoverHandler);
  canvas.addEventListener('mouseleave', canvas._leaveHandler);
}

/**
 * Render detailed conference information for selected conferences
 */
function renderConferenceDetails(container) {
  container.innerHTML = '';

  if (selectedConferences.size === 0) {
    container.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: var(--space-4);">Select a conference to view details</p>';
    return;
  }

  // Get selected conferences in order
  const selectedByLevel = Array.from(selectedConferences.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([conf]) => conf);

  selectedByLevel.forEach((confName) => {
    // Get all data for this conference sorted by year
    const confHistory = allStats
      .filter(s => s.conference === confName && (selectedCategory === null || s.category === selectedCategory))
      .sort((a, b) => b.year - a.year);

    const confData = confHistory[0];
    if (!confData) return;

    // Calculate submission trend percentage (year-over-year change)
    let submissionTrendPct = null;
    if (confHistory.length > 1) {
      const latest = confHistory[0].submissions;
      const previous = confHistory[1].submissions;
      submissionTrendPct = ((latest - previous) / previous) * 100;
    }

    const categoryColor = getCategoryColor(selectedCategory);

    const card = document.createElement('div');
    card.className = 'conference-detail-card';
    card.style.borderTopColor = categoryColor;

    card.innerHTML = `
      <div class="conference-detail-header">
        <h3>${confData.ordinal ? confData.ordinal + ' ' : ''}${confName} ${confData.year}</h3>
      </div>
      <p class="conference-detail-full-name">${confData.full_name}</p>

      <div class="conference-detail-grid">
        <div class="conference-detail-section">
          <h4>Acceptance Rate</h4>
          <p>Latest (${confData.year}): <strong>${confData.acceptance_rate.toFixed(1)}%</strong></p>
        </div>

        <div class="conference-detail-section">
          <h4>Submissions</h4>
          <p>${confData.year}: <strong>${confData.submissions.toLocaleString()}</strong></p>
          ${submissionTrendPct !== null ? `<p style="font-size: 0.875rem; color: var(--color-text-secondary);">Trend: <strong style="color: ${submissionTrendPct >= 0 ? 'var(--color-normal)' : 'var(--color-urgent)'}">${submissionTrendPct > 0 ? '+' : ''}${submissionTrendPct.toFixed(1)}%</strong></p>` : ''}
        </div>

        ${confData.organization ? `
        <div class="conference-detail-section">
          <h4>Organization</h4>
          <p>${confData.organization}</p>
        </div>
        ` : ''}

        ${confData.website ? `
        <div class="conference-detail-section">
          <h4>Website</h4>
          <a href="${confData.website}" target="_blank" rel="noopener">${confData.website}</a>
        </div>
        ` : ''}
      </div>

      <div class="conference-detail-section" style="width: 100%; margin-top: var(--space-4);">
        <h4>Main Discipline</h4>
        <div class="badge-group">
          ${confData.main_discipline.split(';').map(d => `
            <span class="badge" style="background-color: var(--color-accent); border-color: var(--color-accent); color: white; font-weight: 500;">${d.trim()}</span>
          `).join('')}
        </div>
      </div>

      <div class="conference-detail-section" style="width: 100%; margin-top: var(--space-4);">
        <h4>Other Disciplines</h4>
        <div class="badge-group">
          ${confData.other_disciplines.split(';').map(d => `
            <span class="badge" style="background-color: var(--color-warning); border: 1px solid var(--color-warning); color: white; font-weight: 500;">${d.trim()}</span>
          `).join('')}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Update legend for combo chart
 */
function updateComboLegend(conference) {
  const legend = document.getElementById('chart-legend');
  legend.innerHTML = '';

  // Create legend items for the three series
  const items = [
    { label: 'Number of Accepted', color: '#4caf50' },
    { label: 'Number of Rejected', color: '#974343' },
    { label: 'Acceptance Rate', color: '#4caf50' }
  ];

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'legend-item';

    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = item.color;
    if (item.label === 'Acceptance Rate') {
      colorBox.style.borderRadius = '50%';
      colorBox.style.height = '12px';
      colorBox.style.width = '12px';
    }
    div.appendChild(colorBox);

    const label = document.createElement('span');
    label.textContent = item.label;
    div.appendChild(label);

    legend.appendChild(div);
  });
}

/**
 * Populate category buttons dynamically from data
 */
function populateCategoryButtons() {
  const categoryFilter = document.querySelector('.category-filter');
  categoryFilter.innerHTML = '';

  // Add "All" button
  const allButton = document.createElement('button');
  allButton.className = 'category-btn category-btn--active';
  allButton.dataset.category = 'All';
  allButton.textContent = 'All';
  allButton.style.borderColor = 'var(--color-accent)';
  allButton.addEventListener('click', () => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn--active'));
    allButton.classList.add('category-btn--active');
    selectedCategory = null;
    selectedConferences.clear();
    updateDisplay();
  });
  categoryFilter.appendChild(allButton);

  uniqueCategories.forEach((cat) => {
    const button = document.createElement('button');
    button.className = 'category-btn';
    button.dataset.category = cat;
    button.textContent = cat;
    button.style.borderColor = categoryColors.get(cat);
    button.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn--active'));
      button.classList.add('category-btn--active');
      selectedCategory = cat;
      selectedConferences.clear();
      updateDisplay();
    });
    categoryFilter.appendChild(button);
  });
}

/**
 * Update the display based on current filters
 */
function updateDisplay() {
  const minYear = parseInt(document.getElementById('year-min').value) || 2018;
  const maxYear = parseInt(document.getElementById('year-max').value) || 2026;

  filteredStats = filterByCategory(allStats, selectedCategory);
  filteredStats = filterByYear(filteredStats, minYear, maxYear);

  // Rebuild conference chips for the current category
  buildConferenceChips(filterByCategory(allStats, selectedCategory));

  // Render conference details for selected conferences
  renderConferenceDetails(document.getElementById('stats-list'));

  renderTrendChart(filteredStats, document.getElementById('trend-chart'));
}

/**
 * Build and render conference filter chips
 */
function buildConferenceChips(stats) {
  const container = document.getElementById('conference-chips');
  const searchInput = document.getElementById('conference-search');
  const INITIAL_SHOW = 9;

  const allConferences = [...new Set(stats.map(s => s.conference))].sort();
  let expanded = false;

  function render(filter = '') {
    container.innerHTML = '';
    const query = filter.toLowerCase();
    const matches = allConferences.filter(c => c.toLowerCase().includes(query));
    const showing = (filter || expanded) ? matches : matches.slice(0, INITIAL_SHOW);
    const hidden = (!filter && !expanded) ? matches.length - INITIAL_SHOW : 0;

    showing.forEach(conf => {
      const chip = document.createElement('label');
      const isSelected = selectedConferences.has(conf);
      chip.className = 'chip conference-chip' + (isSelected ? ' chip--active' : '');

      // Set color based on conference category if selected
      if (isSelected) {
        const confRecord = allStats.find(s => s.conference === conf);
        if (confRecord) {
          const color = getCategoryColor(confRecord.category);
          chip.style.borderColor = color;
          chip.style.backgroundColor = color + '20';
        }
      }

      chip.textContent = conf;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        // Single selection: clear all and select this one
        selectedConferences.clear();
        selectedConferences.set(conf, 0);
        updateDisplay();
      });
      container.appendChild(chip);
    });

    if (hidden > 0) {
      const more = document.createElement('span');
      more.className = 'chip-more';
      more.textContent = `+${hidden} more`;
      more.style.cursor = 'pointer';
      more.addEventListener('click', () => {
        expanded = true;
        render(filter);
      });
      container.appendChild(more);
    }
  }

  searchInput.addEventListener('input', e => render(e.target.value));
  render('');
}

/**
 * Initialize the stats page
 */
async function init() {
  try {
    allStats = await loadAcceptanceRates();

    if (allStats.length === 0) {
      console.error('No acceptance rates loaded');
      return;
    }

    console.log('Loaded', allStats.length, 'stats records');
    console.log('First record:', allStats[0]);

    // Initialize categories from data
    initializeCategories();
    console.log('Unique categories:', uniqueCategories);

    // Populate category buttons from actual data
    populateCategoryButtons();

    buildConferenceChips(filterByCategory(allStats, selectedCategory));
  } catch (error) {
    console.error('Failed to initialize stats page:', error);
    return;
  }

  // Wire up year range inputs
  const yearMin = document.getElementById('year-min');
  const yearMax = document.getElementById('year-max');
  yearMin.addEventListener('change', updateDisplay);
  yearMax.addEventListener('change', updateDisplay);

  // Initial render
  updateDisplay();
}

document.addEventListener('DOMContentLoaded', init);
