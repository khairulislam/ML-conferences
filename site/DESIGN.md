# ML Conferences Site — Design Overview

**Last Updated**: May 19, 2026  
**Status**: Phases 1-2 Complete, Phase 3 (Papers) Planned

---

## Purpose

A modern, lightweight hub for tracking ML conference deadlines and acceptance rate trends. Users can:
1. **Track upcoming submission deadlines** with live countdown timers and timezone support
2. **Explore historical acceptance rates** with interactive charts and filtering
3. **Browse accepted papers** (planned for Phase 3)

No login required. All data is public and loaded from CSV files. Zero external dependencies.

---

## User Workflow

### Landing: Deadlines Page (Phase 1)
User arrives at the site and sees:
- **Live countdown timers** for upcoming conference deadlines
- **Visual urgency indicators** (color-coded by how soon the deadline is)
- **Filter controls**: Toggle between "all conferences" and "active only", filter by research area (ML, CV, NLP, etc.)
- **Timezone support**: All times converted to their local timezone automatically
- **Conference details**: Location, dates, submission links

*Use case*: Researcher checking "which ML conference has the nearest deadline and what's my local time for submission?"

---

### Statistics: Acceptance Rate Trends (Phase 2)
User clicks "Stats" and sees:
- **Acceptance rate cards** listing each conference with latest year's acceptance %, submission count, and year-over-year submission trend
- **Interactive trend chart** showing how acceptance rates have changed over the last 5+ years for selected conferences
- **Filter controls**: By research area, by year range, by sort preference (acceptance rate, year, name)
- **Conference details**: When clicking a conference, shows metadata (organization, website, disciplines) and historical stats

*Use case*: PhD student researching "which conferences accept papers in my area, and how competitive is each one?"

---

### Papers: Accepted Papers Browser (Phase 3 — Planned)
User clicks "Papers" and sees:
- **Searchable list** of accepted papers from major ML conferences
- **Filter by conference**, year, or keyword
- **Links to PDFs** and author information
- **Per-paper metadata** (abstract, authors, venue)

*Use case*: Researcher finding relevant published work: "What papers on transformers were accepted at NeurIPS 2024?"

---

## Data Structure

### Conferences CSV
- **What**: List of upcoming/recent ML conferences
- **Columns**: Name, full name, year, category, deadlines (abstract & paper), timezone, location, links
- **Size**: ~30 conferences
- **Usage**: Powers the Deadlines page countdown timers and filtering

### Acceptance Rates CSV
Split into two files for efficiency:
- **Metadata**: One row per unique conference with static info (full name, organization, disciplines, website)
- **Yearly Data**: One row per conference-year combination (submissions, accepted, acceptance rate, location, etc.)
- **Size**: ~100 conferences × 10-20 years = ~2,800 rows total
- **Usage**: Powers the Statistics page charts and trend analysis

### Papers CSV (Planned)
- **What**: Accepted papers from major ML conferences
- **Columns**: Conference, year, title, authors, abstract, pdf_url
- **Size**: Potentially 1,000+ papers
- **Usage**: Powers the Papers browser search and filtering

---

## Technical Approach

**No framework, no build step, no database.**

- **HTML**: Semantic structure with navigation and containers for dynamic content
- **CSS**: Design tokens (colors, spacing) → reusable components → page-specific layouts
- **JavaScript**: Vanilla ES6+ modules that load data, transform it, and render to the DOM
- **Data**: CSV files loaded via `fetch()`, parsed manually, transformed as needed
- **Timezone**: UTC-12 (Anywhere on Earth) standard; automatic conversion to user's local timezone

This approach keeps the site:
- **Fast**: No overhead, instant page loads
- **Simple**: Easy to understand, maintain, and extend
- **Scalable**: CSV-based data works well up to thousands of rows

---

## Navigation & Pages

```
/
├── deadlines.html   [Deadline tracker with countdowns]
├── stats.html       [Acceptance rate trends and comparison]
├── papers.html      [Papers browser — coming soon]
└── index.html       [Redirect to deadlines]
```

Each page is independent but shares:
- **Design system**: Colors, spacing, typography via CSS tokens
- **Data layer**: CSV loading and timezone utilities
- **Navigation**: Header with links to other pages

---

## Key Features

### Phase 1: Deadlines
- ✅ Live countdown timers (update every second)
- ✅ Timezone-aware deadline display (converts to user's local time)
- ✅ Urgency coloring (green → yellow → orange → red as deadline approaches)
- ✅ Category filtering (by research area: ML, CV, NLP, Data Mining, Software Engineering)
- ✅ Active-only toggle (hide past deadlines)
- ✅ Responsive design (works on mobile, tablet, desktop)

### Phase 2: Statistics
- ✅ Acceptance rate cards (latest year's stats with trends)
- ✅ Trend visualization (multi-line chart showing acceptance rates over 5+ years)
- ✅ Conference metadata (organization, website, research disciplines)
- ✅ Filtering and sorting (by category, year range, sort order)
- ✅ Submission trend analysis (year-over-year growth/decline)
- ✅ Responsive design

### Phase 3: Papers (Planned)
- [ ] Paper search and filtering
- [ ] Per-conference paper browsing
- [ ] Keywords and topic tagging
- [ ] Links to PDFs and author profiles

---

## Design Principles

1. **User-first**: Focus on what researchers actually need (deadlines, trends, papers)
2. **Simplicity**: No unnecessary complexity; prefer straightforward solutions
3. **Clarity**: Color coding, clear labels, timezone information always visible
4. **Performance**: Fast loads, smooth interactions, no external dependencies
5. **Accessibility**: Semantic HTML, readable contrast, keyboard navigation

---

## Maintenance

### Adding Data
- **New conference deadline**: Add row to `conferences.csv`
- **Acceptance rate update**: Add row to `acceptance_rates_yearly.csv`
- **New paper**: Add row to `papers.csv` (Phase 3)

### CSS Updates
- Change design: Update `tokens.css` (colors, spacing, fonts)
- New component: Add to `components.css`
- Page-specific style: Update `deadlines.css`, `stats.css`, etc.

### JavaScript Updates
- New feature: Add/modify modules in `js/`
- New page: Create new HTML file + corresponding JS module
- Data transformation: Update `data.js` or module-specific loading logic

---

## Future Roadmap

1. **Phase 3**: Papers browser with search and filtering
2. **Notifications**: Email/browser reminders for upcoming deadlines
3. **Calendar Export**: iCal support for deadline sync
4. **Comparison Mode**: Side-by-side acceptance rate comparison for 2-3 conferences
5. **Historical Analysis**: Acceptance rate trends, volatility rankings, submission growth
