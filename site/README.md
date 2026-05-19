# ML Conferences Site

A modern, modular website for tracking ML conference deadlines and statistics. Built with vanilla HTML, CSS, and JavaScript — no framework dependencies.

**Live**: Coming soon (Phase 3 for deployment)  
**Source**: https://github.com/khairulislam/ML-conferences  
**Data**: Extracted from README + reference projects

---

## 🚀 Quick Start

### Local Development

```bash
cd site
python -m http.server 8000
# or: npx http-server
```

Then open http://localhost:8000/ in your browser.

### Pages

- **Deadlines** (Phase 1 ✅) — Live countdown timer for conference submission deadlines
- **Statistics** (Phase 2 ✅) — Historical acceptance rates and trends
- **Papers** (Phase 3 🚧) — Accepted papers browser (coming soon)

---

## 📊 Phase Status

### Phase 1: Deadlines Tracker ✅

- Live countdown timers with urgency classification
- Timezone-aware deadline display (UTC-12 AoE support)
- Filter by category (ML, CV, NLP, Data Mining, SE)
- Toggle: All conferences vs. Active only
- Responsive design (mobile-first)
- Data: 30 conferences from 2026
- **See**: [PHASE1.md](./PHASE1.md)

### Phase 2: Statistics ✅

- Acceptance rate visualization with progress bars
- Multi-line trend chart (2010-2026)
- **Dataset Toggle**: Major (94 conferences) vs All (101 conferences)
- **Year Range Filter**: Adjustable from 2010-2026
- Sort by rate, year, or name (4 modes)
- Filter by category (ML, CV, NLP, DM, SE)
- Responsive list view + canvas chart
- Data: 1,438 records (major) / 1,490 records (all)
- **See**: [PHASE2.md](./PHASE2.md)

### Phase 3: Papers Browser 🚧

- Search accepted papers
- Filter by conference
- Display metadata (title, authors, year)
- Responsive grid layout
- **Planned for**: Next iteration

---

## 📁 Folder Structure

```
site/
├── index.html                 # Entry point (redirect to /deadlines)
├── deadlines.html             # Deadline tracker page
├── stats.html                 # Statistics page
├── papers.html                # Papers browser (placeholder)
├── data/
│   ├── conferences.csv           # Phase 1: 30 conference deadlines
│   ├── acceptance_rates_major.csv # Phase 2: 1,438 records (default)
│   ├── acceptance_rates_all.csv   # Phase 2: 1,490 records (complete)
├── css/
│   ├── tokens.css             # Design system (colors, spacing, fonts)
│   ├── base.css               # Reset + typography
│   ├── components.css         # Reusable UI components
│   ├── deadlines.css          # Deadlines page styling
│   └── stats.css              # Statistics page styling
├── js/
│   ├── data.js                # CSV loading + timezone normalization
│   ├── countdown.js           # Countdown timer engine
│   ├── filter.js              # Filter state management
│   ├── render.js              # DOM rendering (deadlines)
│   ├── stats.js               # Statistics logic + chart
│   └── main.js                # Deadlines page entry point
├── PHASE1.md                  # Phase 1 documentation
├── PHASE2.md                  # Phase 2 documentation
├── ARCHITECTURE.md            # Architecture guide
└── README.md                  # This file
```

---

## 🎨 Design System

### Colors
**Dark Theme** (default)
- Background: `#0f1117`
- Surface: `#1a1d27`
- Text Primary: `#e8eaf6`
- Text Secondary: `#9094b3`
- Accent: `#5c6bc0`

**Light Theme** (via `@media (prefers-color-scheme: light)`)
- Automatically inverts colors
- Maintains contrast ratios (WCAG AA)

### Urgency Colors
- 🟢 **Normal** (> 30d): `#66bb6a`
- 🟡 **Attention** (8-30d): `#ffd54f`
- 🟠 **Warning** (4-7d): `#ff9800`
- 🔴 **Urgent** (1-3d): `#ef5350` + pulse animation
- ⚫ **Past** (≤ 0d): `#616161` + faded

### Category Colors
- **ML**: `#7c4dff` (Purple)
- **CV**: `#00bcd4` (Cyan)
- **NLP**: `#4caf50` (Green)
- **DM**: `#ff7043` (Orange)
- **SE**: `#f06292` (Pink)

---

## 🔧 Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties (variables), media queries, grid/flex
- **JavaScript ES6+**: Modules, async/await, arrow functions
- **Data**: CSV (parsed manually, no libraries)
- **Rendering**: Canvas (for trend chart)
- **Storage**: localStorage (for filter persistence)

**No Dependencies**: Zero npm packages, no build step, no framework.

---

## 📚 Key Features

### Deadlines Page
- ✅ Live countdown timers (update each second)
- ✅ Timezone-aware display (automatic user timezone detection)
- ✅ UTC-12 (Anywhere on Earth) deadline support
- ✅ Urgency-based color coding
- ✅ Category filters with visual chips
- ✅ All vs. Active conferences toggle
- ✅ Past deadlines section
- ✅ Responsive layout (mobile-first)
- ✅ Dark + light theme support
- ✅ Filter persistence (localStorage)

### Statistics Page
- ✅ Acceptance rate visualization
- ✅ Multi-line trend chart (canvas-based)
- ✅ Historical data (2020-2024)
- ✅ Category filtering
- ✅ 4 sort modes (rate, year, name)
- ✅ Responsive list + chart layout
- ✅ Progress bars for acceptance rates
- ✅ Legend with color coding

---

## 🧠 Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design documentation.

### Module Organization
- `data.js` — CSV loading + timezone normalization
- `countdown.js` — Global countdown timer engine
- `filter.js` — Filter state + localStorage persistence
- `render.js` — DOM rendering (deadlines page)
- `stats.js` — Statistics logic + chart rendering
- `main.js` — Deadlines page entry point

### Design Principles
1. **Modularity**: Each module has a clear responsibility
2. **Simplicity**: No frameworks, no build step, no dependencies
3. **Performance**: Single global timer, efficient rendering
4. **Maintainability**: CSS layers, pure functions, clear data flow

---

## 📝 Data Schemas

### conferences.csv (Phase 1)
```csv
name,full_name,year,category,abstract_deadline,paper_deadline,
deadline_timezone,conf_start,conf_end,location,homepage,status,notes
```

Example:
```
NeurIPS,Neural Information Processing Systems,2026,ML,2026-05-04T23:59:00,2026-05-06T23:59:00,UTC-12,2026-12-06,2026-12-12,Sydney Australia,https://neurips.cc/Conferences/2026,open,
```

### acceptance_rates.csv (Phase 2)
```csv
conference,full_name,year,category,submissions,accepted,acceptance_rate
```

Example:
```
NeurIPS,Neural Information Processing Systems,2024,ML,13472,3172,23.5
```

---

## 🌐 Browser Support

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

**Requirements**:
- ES6+ support
- CSS custom properties
- Canvas 2D context
- Intl API (for timezone names)

---

## 🚢 Deployment

### GitHub Pages
1. Push changes to repo
2. Configure Pages to serve from `site/` folder
3. Site will be available at `https://github.com/khairulislam/ML-conferences/`

### Alternative Hosting
- Netlify, Vercel, AWS S3, etc. — any static hosting works
- No backend required; all data is CSV files

---

## 🛠️ Development

### Adding Conferences
1. Get deadline from announcement
2. Add row to `data/conferences.csv` (ISO 8601 format)
3. Site auto-reloads on next visit

### Updating Acceptance Rates
1. Get final acceptance rates from conference site
2. Add row to `data/acceptance_rates.csv`
3. Chart updates automatically on next visit

### CSS Changes
1. Update design tokens in `css/tokens.css` first
2. Override components in `css/components.css`
3. Page-specific tweaks in `css/deadlines.css` or `css/stats.css`
4. Test in both dark and light modes

### JavaScript Changes

- Keep modules focused (single responsibility)
- Use pure functions where possible
- Test in browser DevTools console
- Check for console errors on page load

---

## 🐛 Troubleshooting

### Countdown not updating
- Check browser console for errors
- Verify `countdown.js` is loaded
- Check that deadline date is in the future

### Filters not persisting
- Check localStorage is enabled
- Try clearing site data and reloading
- Check `filter.js` key: `ml-conf-filter-state`

### Chart not rendering
- Verify `acceptance_rates.csv` is loaded
- Check canvas element exists in HTML
- Open DevTools console for errors

### Timezone display wrong
- Verify browser locale settings
- Check `data.js` timezone parsing
- Try different browser for comparison

---

## 📈 Future Roadmap

### Phase 3: Papers Browser
- Search accepted papers by title/author
- Filter by conference and year
- Display paper metadata
- Link to full PDFs (where available)

### Phase 4: Advanced Features
- Email notifications for deadlines
- Calendar integration (iCal export)
- Submission guidelines by conference
- Review board member lookup
- Competition statistics (similar conferences)

### Phase 5+: Community Features
- User accounts + bookmarks
- Social sharing
- Comments / discussions
- Conference ratings
- Reviewer networks

---

## 📄 License

This project is open source. Data extracted from:
- [ML-Conferences Repository](https://github.com/khairulislam/ML-conferences)
- [CS Conference Stats](https://csconfstats.xoveexu.com/)
- Individual conference websites

---

## 👨‍💻 Contributing

Contributions welcome! To add conferences, update acceptance rates, or improve the site:

1. Fork the repository
2. Make your changes
3. Submit a pull request
4. We'll review and merge

**Focus areas**:
- Add more conferences
- Expand historical acceptance rate data
- Improve visualizations
- Add new features (notifications, calendar, etc.)

---

## 📞 Support

Found a bug or have a suggestion?

- Check existing issues: https://github.com/khairulislam/ML-conferences/issues
- Open a new issue with details
- Include browser + OS info if it's a bug

---

## 🎯 Project Goals

1. **Centralized Hub**: One place to track all ML conference deadlines
2. **Modern UX**: Fast, responsive, beautiful interface
3. **Data Transparency**: CSV-based (no hidden algorithms)
4. **Accessibility**: Works for all users, all devices
5. **Simplicity**: No complex infrastructure, easy to maintain
6. **Community-Driven**: Open to contributions and feedback

---

## 📊 Statistics

- **Conferences Tracked**: 30+ (Phase 1)
- **Historical Records**: 96 (Phase 2)
- **Lines of Code**: ~3000 (HTML + CSS + JS)
- **Dependencies**: 0 (zero)
- **Page Size**: < 500KB (including data)
- **Load Time**: < 1 second (local file)

---

Last updated: May 18, 2026
