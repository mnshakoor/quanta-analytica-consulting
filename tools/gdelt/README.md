# GDELT Event Search & Analysis Application

A full-featured interactive web application for searching and analyzing GDELT (Global Database of Events, Language, and Tone) data, built for Quanta Analytica (MNS Consulting).

## Features

### 📄 Search & Results
- **One-click query execution** with 18 predefined GDELT searches
- **Customizable result limits** (1-250 articles)
- **Real-time data fetching** from GDELT DOC 2.0 API
- **Article display** with title, date, source, tone, and URL
- **Multiple export formats**: JSON, CSV, and XML

### 🗺️ Map View (Satellite)
- **Interactive satellite basemap** using ESRI World Imagery
- **Automatic location extraction** from article titles
- **Clustered markers** showing event distribution
- **Popup information** with article details and links
- **Auto-zoom** to fit all markers

### 🌐 Link Network View
- **Force-directed graph** visualization using D3.js
- **Actor and keyword extraction** from article content
- **Co-occurrence analysis** showing relationships
- **Interactive features**:
  - Drag nodes to reposition
  - Zoom and pan
  - Search to highlight nodes
  - Filter by keyword
  - Hover to see connections
- **Color-coded nodes**:
  - Red: Conflict/security keywords
  - Blue: Named entities

### 🔧 Debug & Quality Assurance
- **Automated query testing** on application load
- **Validation checks**:
  - HTTP response status
  - JSON format validation
  - Result count verification
- **Error reporting** with detailed messages
- **Test summary** with pass/warning/fail counts

## Technology Stack

- **Frontend**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript
- **Mapping**: Leaflet.js with ESRI satellite basemap
- **Visualization**: D3.js (v7) for network graphs
- **API**: GDELT DOC 2.0 and GEO 2.0 APIs
- **Data Formats**: JSON, CSV, XML export support

## File Structure

```
gdelt-app/
├── index.html          # Main HTML file with tab structure
├── style.css           # Custom CSS styling
├── app.js              # Main JavaScript application logic
├── queries.json        # Predefined GDELT query definitions
└── README.md           # This file
```

## Installation & Deployment

### Local Development

1. **Clone or download** this repository
2. **Serve the files** using any web server:

   **Option 1: Python**
   ```bash
   python3 -m http.server 8000
   ```

   **Option 2: Node.js**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3: PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

### GitHub Pages Deployment

1. **Create a GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gdelt-app.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "main" branch as source
   - Click Save

3. **Access your app**: `https://YOUR_USERNAME.github.io/gdelt-app/`

### Alternative Hosting Options

#### Netlify
1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the `gdelt-app` folder
3. Your app will be live instantly

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

#### Cloudflare Pages
1. Create account at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Deploy with default settings

## Usage Guide

### Running Queries

1. **Select a query** from the left sidebar
2. **Adjust max records** if needed (default: 250)
3. **Click the query button** to execute
4. **View results** in the main panel

### Exporting Data

1. **Run a query** to populate results
2. **Click export button** (JSON, CSV, or XML)
3. **File downloads** automatically

### Viewing Map

1. **Run a query** with geographic content
2. **Switch to Map View tab**
3. **Click markers** to see article details
4. **Map auto-zooms** to show all locations

### Exploring Network

1. **Run a query** to populate data
2. **Switch to Link Network View tab**
3. **Interact with the graph**:
   - Drag nodes to reposition
   - Use search box to highlight nodes
   - Use filter box to hide/show nodes
   - Hover over nodes to see connections

### Quality Assurance

1. **Switch to Debug & QA tab**
2. **Click "Run QA Tests"**
3. **Review results** for each query
4. **Check for errors** or warnings

## Query Categories

The application includes 18 predefined queries organized by theme:

1. **Humanitarian Crisis** - Food insecurity, aid access, human rights
2. **Influence Operations** - Information warfare, cognitive warfare
3. **Sahel Conflict** - Military operations in Mali, Niger, Burkina Faso
4. **ReliefWeb Humanitarian** - Humanitarian coverage from ReliefWeb
5. **Disinformation Contagion** - Disease framing of disinformation
6. **Information Operations & Social Media** - Near/repeat query patterns
7. **Narrative Conflict** - Contagion to conflict framing
8. **Censorship & Control** - Internet restrictions and media control
9. **UN Peacekeeping & Human Rights** - UN News coverage
10. **Conflict Prevention** - Humanitarian assistance from UN/ReliefWeb
11. **Armed Conflict** - General military clashes
12. **Regional Armed Conflict** - Sahel and Horn of Africa
13. **Civil Unrest** - Global protests and demonstrations
14. **African Civil Unrest** - Nigeria, Kenya, South Africa, Sudan
15. **Humanitarian-Political Intersection** - Food insecurity and protests
16. **Protest Escalation** - Violence in protests
17. **Peace Agreements** - Ceasefires and peace talks
18. **Conflict-Cognitive Framing** - War on Information metaphors

## API Documentation

### GDELT DOC 2.0 API

- **Base URL**: `https://api.gdeltproject.org/api/v2/doc/doc`
- **Parameters**:
  - `query`: Search terms (URL-encoded)
  - `mode`: ArtList, TimelineVol, TimelineTone
  - `format`: JSON, HTML, CSV
  - `maxrecords`: 1-250
  - `sort`: DateDesc, DateAsc, HybridRel

### GDELT GEO 2.0 API

- **Base URL**: `https://api.gdeltproject.org/api/v2/geo/geo`
- **Parameters**:
  - `query`: Search terms
  - `format`: json
  - `maxrows`: Number of results

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

- **Low-bandwidth optimized**: Minimal external dependencies
- **CDN delivery**: All libraries loaded from CDN
- **Lazy loading**: Map and network only initialize when tabs are opened
- **Efficient rendering**: D3.js force simulation with collision detection

## Data Attribution

This application uses data from the GDELT Project:

> **GDELT Project**  
> The GDELT Project monitors the world's broadcast, print, and web news from nearly every corner of every country in over 100 languages.  
> [gdeltproject.org](https://www.gdeltproject.org/)

## Ethics & Privacy

- **No data storage**: All queries are executed client-side
- **No API keys required**: GDELT API is open and free
- **No user tracking**: No analytics or tracking scripts
- **Proper attribution**: GDELT terms of service complied with

## Troubleshooting

### Queries Failing

- **Check internet connection**
- **Verify GDELT API status** at [gdeltproject.org](https://www.gdeltproject.org/)
- **Run QA tests** to identify problematic queries
- **Check browser console** for error messages

### Map Not Loading

- **Ensure query has geographic content**
- **Check that Leaflet.js loaded** (browser console)
- **Try a different basemap** if ESRI is down

### Network Graph Empty

- **Ensure query returned results**
- **Check that D3.js loaded** (browser console)
- **Try refreshing the network**

## Future Enhancements

- [ ] Timeline visualization for temporal analysis
- [ ] Sentiment analysis charts
- [ ] Advanced filtering options
- [ ] Custom query builder
- [ ] Data persistence (localStorage)
- [ ] Real-time updates
- [ ] Multi-language support

## License

This project is created for Quanta Analytica (MNS Consulting). All rights reserved.

## Credits

**Developed for**: Quanta Analytica (MNS Consulting)  
**GDELT Data**: The GDELT Project  
**Mapping**: Leaflet.js, ESRI World Imagery  
**Visualization**: D3.js  
**UI Framework**: Bootstrap 5

## Support

For issues or questions, please refer to:
- GDELT Documentation: [gdeltproject.org/data.html](https://www.gdeltproject.org/data.html)
- GDELT API Guide: [blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)

---

**Version**: 1.0.0  
**Last Updated**: October 2025

