// GDELT Event Search & Analysis Application
// Quanta Analytica (MNS Consulting)

// Global state
const appState = {
    queries: [],
    currentQuery: null,
    currentResults: null,
    map: null,
    markers: [],
    networkData: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadQueries();
    initializeEventListeners();
    showStatus('Application loaded successfully', 3000);
});

// Load queries from JSON file
async function loadQueries() {
    try {
        const response = await fetch('queries.json');
        appState.queries = await response.json();
        renderQueryButtons();
    } catch (error) {
        showError('Failed to load queries: ' + error.message);
    }
}

// Render query buttons
function renderQueryButtons() {
    const container = document.getElementById('queryButtons');
    container.innerHTML = '';
    
    appState.queries.forEach(query => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary';
        button.innerHTML = `<strong>${query.name}</strong><br><small>${query.description}</small>`;
        button.onclick = () => executeQuery(query);
        container.appendChild(button);
    });
}

// Execute a GDELT query
async function executeQuery(query) {
    try {
        showStatus('Executing query: ' + query.name);
        appState.currentQuery = query;
        
        // Update active button
        document.querySelectorAll('#queryButtons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.btn').classList.add('active');
        
        // Modify URL to use maxRecords from input
        const maxRecords = document.getElementById('maxRecords').value;
        let url = query.url;
        
        // Replace maxrecords parameter if it exists
        if (url.includes('maxrecords=')) {
            url = url.replace(/maxrecords=\d+/, `maxrecords=${maxRecords}`);
        } else {
            url += `&maxrecords=${maxRecords}`;
        }
        
        // Ensure format is JSON
        if (!url.includes('format=JSON') && !url.includes('FORMAT=json')) {
            url = url.replace(/format=html/i, 'format=JSON');
            if (!url.includes('format=')) {
                url += '&format=JSON';
            }
        }
        
        // Fetch data from GDELT API
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // Try to parse as JSON anyway
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Response is not valid JSON');
            }
        }
        
        appState.currentResults = data;
        
        // Display results based on mode
        if (query.url.includes('mode=ArtList') || query.url.includes('mode=artlist')) {
            displayArticleResults(data);
        } else if (query.url.includes('mode=Timeline')) {
            displayTimelineResults(data);
        } else {
            displayArticleResults(data);
        }
        
        showStatus('Query completed successfully', 3000);
        
    } catch (error) {
        showError('Query failed: ' + error.message);
        console.error('Query error:', error);
    }
}

// Display article results
function displayArticleResults(data) {
    const container = document.getElementById('resultsContainer');
    
    if (!data || !data.articles || data.articles.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No results found</p>';
        return;
    }
    
    let html = `<div class="mb-3"><strong>Found ${data.articles.length} articles</strong></div>`;
    
    data.articles.forEach((article, index) => {
        const tone = article.tone || 0;
        const toneClass = tone > 2 ? 'tone-positive' : tone < -2 ? 'tone-negative' : 'tone-neutral';
        const toneLabel = tone > 2 ? 'Positive' : tone < -2 ? 'Negative' : 'Neutral';
        
        html += `
            <div class="article-card">
                <div class="article-title">${index + 1}. ${article.title || 'Untitled'}</div>
                <div class="article-meta">
                    <span class="article-tone ${toneClass}">${toneLabel} (${tone.toFixed(2)})</span>
                    ${article.seendate ? `<span class="ms-2">📅 ${formatDate(article.seendate)}</span>` : ''}
                    ${article.domain ? `<span class="ms-2">🌐 ${article.domain}</span>` : ''}
                    ${article.language ? `<span class="ms-2">🗣️ ${article.language}</span>` : ''}
                </div>
                ${article.url ? `<div class="article-url"><a href="${article.url}" target="_blank" rel="noopener">${article.url}</a></div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Display timeline results
function displayTimelineResults(data) {
    const container = document.getElementById('resultsContainer');
    
    if (!data || !data.timeline || data.timeline.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No timeline data found</p>';
        return;
    }
    
    let html = `<div class="mb-3"><strong>Timeline Data (${data.timeline.length} points)</strong></div>`;
    html += '<div class="table-responsive"><table class="table table-sm table-striped">';
    html += '<thead><tr><th>Date</th><th>Value</th></tr></thead><tbody>';
    
    data.timeline.forEach(point => {
        html += `<tr><td>${point.date || point.datetime || 'N/A'}</td><td>${point.value || point.count || 0}</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Format date string
function formatDate(dateStr) {
    try {
        // GDELT dates are typically in YYYYMMDDHHMMSS format
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateStr;
    }
}

// Export functions
function exportJSON() {
    if (!appState.currentResults) {
        showError('No results to export');
        return;
    }
    
    const dataStr = JSON.stringify(appState.currentResults, null, 2);
    downloadFile(dataStr, 'gdelt-results.json', 'application/json');
    showStatus('Exported as JSON', 2000);
}

function exportCSV() {
    if (!appState.currentResults || !appState.currentResults.articles) {
        showError('No article results to export');
        return;
    }
    
    const articles = appState.currentResults.articles;
    
    // CSV headers
    let csv = 'Title,URL,Domain,Language,Date,Tone\n';
    
    // CSV rows
    articles.forEach(article => {
        const title = (article.title || '').replace(/"/g, '""');
        const url = article.url || '';
        const domain = article.domain || '';
        const language = article.language || '';
        const date = article.seendate || '';
        const tone = article.tone || 0;
        
        csv += `"${title}","${url}","${domain}","${language}","${date}","${tone}"\n`;
    });
    
    downloadFile(csv, 'gdelt-results.csv', 'text/csv');
    showStatus('Exported as CSV', 2000);
}

function exportXML() {
    if (!appState.currentResults || !appState.currentResults.articles) {
        showError('No article results to export');
        return;
    }
    
    const articles = appState.currentResults.articles;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n';
    
    articles.forEach(article => {
        xml += '  <article>\n';
        xml += `    <title>${escapeXML(article.title || '')}</title>\n`;
        xml += `    <url>${escapeXML(article.url || '')}</url>\n`;
        xml += `    <domain>${escapeXML(article.domain || '')}</domain>\n`;
        xml += `    <language>${escapeXML(article.language || '')}</language>\n`;
        xml += `    <date>${escapeXML(article.seendate || '')}</date>\n`;
        xml += `    <tone>${article.tone || 0}</tone>\n`;
        xml += '  </article>\n';
    });
    
    xml += '</results>';
    
    downloadFile(xml, 'gdelt-results.xml', 'application/xml');
    showStatus('Exported as XML', 2000);
}

// Helper function to escape XML special characters
function escapeXML(str) {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}

// Download file helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize event listeners
function initializeEventListeners() {
    // Export buttons
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportXML').addEventListener('click', exportXML);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        if (appState.currentQuery) {
            executeQuery(appState.currentQuery);
        } else {
            showError('Please select a query first');
        }
    });
    
    // QA test button
    document.getElementById('runQATests').addEventListener('click', runQATests);
    
    // Map tab - initialize map when tab is shown
    document.getElementById('map-tab').addEventListener('shown.bs.tab', () => {
        initializeMap();
    });
    
    // Network tab - initialize network when tab is shown
    document.getElementById('network-tab').addEventListener('shown.bs.tab', () => {
        initializeNetwork();
    });
    
    // Network controls
    document.getElementById('refreshNetwork').addEventListener('click', () => {
        initializeNetwork();
    });
    
    document.getElementById('networkSearch').addEventListener('input', (e) => {
        searchNetworkNode(e.target.value);
    });
    
    document.getElementById('networkFilter').addEventListener('input', (e) => {
        filterNetwork(e.target.value);
    });
}

// Status and error display functions
function showStatus(message, duration = 0) {
    const statusBar = document.getElementById('statusBar');
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusBar.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            statusBar.style.display = 'none';
        }, duration);
    }
}

function showError(message, duration = 5000) {
    const errorBar = document.getElementById('errorBar');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorBar.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(() => {
            errorBar.style.display = 'none';
        }, duration);
    }
}

// Initialize map
function initializeMap() {
    if (appState.map) {
        updateMapMarkers();
        return; // Map already initialized
    }
    
    const container = document.getElementById('mapContainer');
    
    // Initialize Leaflet map with satellite basemap
    appState.map = L.map('mapContainer').setView([20, 0], 2);
    
    // Add ESRI World Imagery (satellite) basemap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18
    }).addTo(appState.map);
    
    // Add labels overlay
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(appState.map);
    
    updateMapMarkers();
}

// Update map markers based on current results
async function updateMapMarkers() {
    if (!appState.map) return;
    
    // Clear existing markers
    appState.markers.forEach(marker => appState.map.removeLayer(marker));
    appState.markers = [];
    
    if (!appState.currentResults || !appState.currentResults.articles) {
        return;
    }
    
    showStatus('Extracting location data...');
    
    // Try to fetch location data using GDELT GEO API
    if (appState.currentQuery) {
        try {
            await fetchGeoData();
        } catch (error) {
            console.error('GEO API error:', error);
        }
    }
    
    // Extract locations from article data
    const locationMap = new Map();
    
    appState.currentResults.articles.forEach(article => {
        // Try to extract location mentions from title and URL
        const locations = extractLocationsFromText(article.title || '');
        
        locations.forEach(loc => {
            if (!locationMap.has(loc.name)) {
                locationMap.set(loc.name, {
                    name: loc.name,
                    lat: loc.lat,
                    lon: loc.lon,
                    articles: []
                });
            }
            locationMap.get(loc.name).articles.push(article);
        });
    });
    
    // Add markers for each location
    let markerCount = 0;
    locationMap.forEach((location, name) => {
        if (location.lat && location.lon) {
            const marker = L.marker([location.lat, location.lon])
                .bindPopup(createLocationPopup(location))
                .addTo(appState.map);
            
            appState.markers.push(marker);
            markerCount++;
        }
    });
    
    // Fit bounds if we have markers
    if (appState.markers.length > 0) {
        const group = L.featureGroup(appState.markers);
        appState.map.fitBounds(group.getBounds().pad(0.1));
    }
    
    showStatus(`Mapped ${markerCount} locations`, 3000);
}

// Fetch geographic data from GDELT GEO API
async function fetchGeoData() {
    if (!appState.currentQuery) return;
    
    // Extract query parameter from current query URL
    const urlParams = new URLSearchParams(appState.currentQuery.url.split('?')[1]);
    const query = urlParams.get('query');
    
    if (!query) return;
    
    // Build GEO API URL
    const geoUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${query}&format=json&maxrows=100`;
    
    try {
        const response = await fetch(geoUrl);
        if (response.ok) {
            const geoData = await response.json();
            if (geoData && geoData.features) {
                appState.geoData = geoData;
            }
        }
    } catch (error) {
        console.error('GEO API fetch error:', error);
    }
}

// Extract locations from text using common place names
function extractLocationsFromText(text) {
    const locations = [];
    
    // Common locations database (simplified - in production, use a proper geocoding service)
    const knownLocations = {
        'Mali': { lat: 17.5707, lon: -3.9962 },
        'Niger': { lat: 17.6078, lon: 8.0817 },
        'Burkina Faso': { lat: 12.2383, lon: -1.5616 },
        'Sudan': { lat: 12.8628, lon: 30.2176 },
        'South Sudan': { lat: 6.8770, lon: 31.3070 },
        'Somalia': { lat: 5.1521, lon: 46.1996 },
        'Ethiopia': { lat: 9.1450, lon: 40.4897 },
        'Nigeria': { lat: 9.0820, lon: 8.6753 },
        'Kenya': { lat: -0.0236, lon: 37.9062 },
        'South Africa': { lat: -30.5595, lon: 22.9375 },
        'Syria': { lat: 34.8021, lon: 38.9968 },
        'Iraq': { lat: 33.2232, lon: 43.6793 },
        'Afghanistan': { lat: 33.9391, lon: 67.7100 },
        'Yemen': { lat: 15.5527, lon: 48.5164 },
        'Libya': { lat: 26.3351, lon: 17.2283 },
        'Ukraine': { lat: 48.3794, lon: 31.1656 },
        'Russia': { lat: 61.5240, lon: 105.3188 },
        'China': { lat: 35.8617, lon: 104.1954 },
        'India': { lat: 20.5937, lon: 78.9629 },
        'Pakistan': { lat: 30.3753, lon: 69.3451 },
        'Iran': { lat: 32.4279, lon: 53.6880 },
        'Turkey': { lat: 38.9637, lon: 35.2433 },
        'Egypt': { lat: 26.8206, lon: 30.8025 },
        'Israel': { lat: 31.0461, lon: 34.8516 },
        'Palestine': { lat: 31.9522, lon: 35.2332 },
        'Lebanon': { lat: 33.8547, lon: 35.8623 },
        'Jordan': { lat: 30.5852, lon: 36.2384 },
        'Saudi Arabia': { lat: 23.8859, lon: 45.0792 },
        'United States': { lat: 37.0902, lon: -95.7129 },
        'United Kingdom': { lat: 55.3781, lon: -3.4360 },
        'France': { lat: 46.2276, lon: 2.2137 },
        'Germany': { lat: 51.1657, lon: 10.4515 },
        'Moscow': { lat: 55.7558, lon: 37.6173 },
        'Beijing': { lat: 39.9042, lon: 116.4074 },
        'Washington': { lat: 38.9072, lon: -77.0369 },
        'London': { lat: 51.5074, lon: -0.1278 },
        'Paris': { lat: 48.8566, lon: 2.3522 },
        'Berlin': { lat: 52.5200, lon: 13.4050 },
        'Damascus': { lat: 33.5138, lon: 36.2765 },
        'Baghdad': { lat: 33.3152, lon: 44.3661 },
        'Kabul': { lat: 34.5553, lon: 69.2075 },
        'Kyiv': { lat: 50.4501, lon: 30.5234 },
        'Gaza': { lat: 31.3547, lon: 34.3088 },
        'Sahel': { lat: 15.0, lon: 0.0 }
    };
    
    Object.keys(knownLocations).forEach(locationName => {
        if (text.includes(locationName)) {
            locations.push({
                name: locationName,
                lat: knownLocations[locationName].lat,
                lon: knownLocations[locationName].lon
            });
        }
    });
    
    return locations;
}

// Create popup content for a location
function createLocationPopup(location) {
    let html = `<div style="max-width: 300px;">`;
    html += `<h6><strong>${location.name}</strong></h6>`;
    html += `<p><strong>${location.articles.length}</strong> article(s) mentioning this location</p>`;
    html += `<hr style="margin: 0.5rem 0;">`;
    
    // Show first 3 articles
    location.articles.slice(0, 3).forEach((article, idx) => {
        html += `<div style="margin-bottom: 0.5rem;">`;
        html += `<small><strong>${idx + 1}.</strong> ${(article.title || 'Untitled').substring(0, 80)}...</small><br>`;
        html += `<small class="text-muted">Tone: ${(article.tone || 0).toFixed(2)}</small>`;
        if (article.url) {
            html += ` <a href="${article.url}" target="_blank" style="font-size: 0.75rem;">Read</a>`;
        }
        html += `</div>`;
    });
    
    if (location.articles.length > 3) {
        html += `<small class="text-muted">...and ${location.articles.length - 3} more</small>`;
    }
    
    html += `</div>`;
    return html;
}

// Initialize network visualization
function initializeNetwork() {
    const container = document.getElementById('networkContainer');
    
    if (!appState.currentResults || !appState.currentResults.articles) {
        container.innerHTML = '<p class="text-muted text-center mt-5">No data available. Please run a query first.</p>';
        return;
    }
    
    showStatus('Building network graph...');
    
    // Extract actors and keywords from results
    const nodes = new Map();
    const links = [];
    const coOccurrence = new Map();
    
    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
        'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old',
        'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too',
        'use', 'will', 'with', 'from', 'have', 'this', 'that', 'they', 'been', 'what', 'when',
        'where', 'which', 'their', 'there', 'these', 'those', 'would', 'could', 'should',
        'about', 'after', 'before', 'other', 'some', 'such', 'than', 'then', 'them', 'more'
    ]);
    
    // Keywords related to conflict, security, and humanitarian issues
    const relevantKeywords = new Set([
        'conflict', 'war', 'peace', 'military', 'attack', 'violence', 'crisis', 'humanitarian',
        'security', 'forces', 'government', 'rebel', 'protest', 'ceasefire', 'operation',
        'offensive', 'defense', 'troops', 'armed', 'combat', 'battle', 'fight', 'clash',
        'insurgent', 'militant', 'terrorism', 'extremist', 'refugee', 'displacement',
        'aid', 'relief', 'assistance', 'emergency', 'disaster', 'famine', 'drought',
        'disinformation', 'propaganda', 'narrative', 'information', 'media', 'social',
        'cyber', 'influence', 'cognitive', 'psychological', 'warfare', 'operations'
    ]);
    
    appState.currentResults.articles.forEach(article => {
        const title = (article.title || '').toLowerCase();
        const words = title.split(/[\s,.:;!?()\[\]{}"']+/)
            .filter(w => w.length > 3 && !stopWords.has(w))
            .filter(w => /^[a-z]+$/.test(w)); // Only alphabetic words
        
        // Extract relevant keywords and named entities
        const articleNodes = [];
        
        words.forEach(word => {
            // Prioritize relevant keywords
            if (relevantKeywords.has(word) || word.length > 6) {
                if (!nodes.has(word)) {
                    nodes.set(word, { 
                        id: word, 
                        count: 1,
                        type: relevantKeywords.has(word) ? 'keyword' : 'entity'
                    });
                } else {
                    nodes.get(word).count++;
                }
                articleNodes.push(word);
            }
        });
        
        // Create co-occurrence links
        for (let i = 0; i < articleNodes.length; i++) {
            for (let j = i + 1; j < articleNodes.length; j++) {
                const pair = [articleNodes[i], articleNodes[j]].sort().join('|');
                if (!coOccurrence.has(pair)) {
                    coOccurrence.set(pair, 1);
                } else {
                    coOccurrence.set(pair, coOccurrence.get(pair) + 1);
                }
            }
        }
    });
    
    // Convert to array and limit to top nodes
    const nodeArray = Array.from(nodes.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 60);
    
    const nodeIds = new Set(nodeArray.map(n => n.id));
    
    // Create links from co-occurrence data
    coOccurrence.forEach((weight, pair) => {
        const [source, target] = pair.split('|');
        if (nodeIds.has(source) && nodeIds.has(target) && weight > 1) {
            links.push({ source, target, weight });
        }
    });
    
    appState.networkData = { nodes: nodeArray, links: links };
    
    renderNetwork();
    showStatus(`Network graph created with ${nodeArray.length} nodes`, 3000);
}

// Render network using D3.js
function renderNetwork() {
    const container = document.getElementById('networkContainer');
    container.innerHTML = '';
    
    if (!appState.networkData || appState.networkData.nodes.length === 0) {
        container.innerHTML = '<p class="text-muted text-center mt-5">No network data available</p>';
        return;
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const svg = d3.select('#networkContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Create links
    const link = g.append('g')
        .selectAll('line')
        .data(appState.networkData.links)
        .enter()
        .append('line')
        .attr('class', 'network-link')
        .attr('stroke-width', d => Math.sqrt(d.weight));
    
    // Create nodes
    const node = g.append('g')
        .selectAll('g')
        .data(appState.networkData.nodes)
        .enter()
        .append('g')
        .attr('class', 'network-node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles for nodes
    node.append('circle')
        .attr('r', d => Math.sqrt(d.count) * 4 + 5)
        .attr('fill', d => d.type === 'keyword' ? '#dc3545' : '#0d6efd')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);
    
    // Add labels
    node.append('text')
        .attr('class', 'network-text')
        .attr('dx', d => Math.sqrt(d.count) * 4 + 8)
        .attr('dy', 4)
        .text(d => d.id)
        .style('font-size', d => Math.min(12 + Math.sqrt(d.count), 16) + 'px')
        .style('font-weight', d => d.count > 5 ? 'bold' : 'normal');
    
    // Add tooltips
    node.append('title')
        .text(d => `${d.id}\nMentions: ${d.count}\nType: ${d.type}`);
    
    // Create force simulation
    const simulation = d3.forceSimulation(appState.networkData.nodes)
        .force('link', d3.forceLink(appState.networkData.links)
            .id(d => d.id)
            .distance(d => 100 - d.weight * 5))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.count) * 4 + 10));
    
    // Update positions on each tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Highlight on hover
    node.on('mouseenter', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', Math.sqrt(d.count) * 4 + 10)
            .attr('opacity', 1);
        
        // Highlight connected links
        link.style('opacity', l => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1
        );
    })
    .on('mouseleave', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', Math.sqrt(d.count) * 4 + 5)
            .attr('opacity', 0.8);
        
        link.style('opacity', 0.6);
    });
}

// Search network node
function searchNetworkNode(keyword) {
    if (!keyword) {
        d3.selectAll('.network-node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        return;
    }
    
    const lowerKeyword = keyword.toLowerCase();
    
    d3.selectAll('.network-node circle')
        .attr('stroke', d => d.id.toLowerCase().includes(lowerKeyword) ? '#ffc107' : '#fff')
        .attr('stroke-width', d => d.id.toLowerCase().includes(lowerKeyword) ? 4 : 2);
    
    d3.selectAll('.network-node text')
        .style('font-weight', d => d.id.toLowerCase().includes(lowerKeyword) ? 'bold' : 
            d.count > 5 ? 'bold' : 'normal')
        .style('fill', d => d.id.toLowerCase().includes(lowerKeyword) ? '#ffc107' : '#000');
}

// Filter network
function filterNetwork(keyword) {
    if (!keyword) {
        d3.selectAll('.network-node').style('opacity', 1);
        return;
    }
    
    d3.selectAll('.network-node')
        .style('opacity', d => d.id.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0.1);
}

// Run QA tests on all queries
async function runQATests() {
    const container = document.getElementById('qaResults');
    container.innerHTML = '<div class="spinner-container"><div class="spinner-border" role="status"></div></div>';
    
    const results = [];
    
    for (const query of appState.queries) {
        try {
            showStatus(`Testing: ${query.name}`);
            
            let url = query.url;
            
            // Ensure format is JSON
            if (!url.includes('format=JSON') && !url.includes('FORMAT=json')) {
                url = url.replace(/format=html/i, 'format=JSON');
                if (!url.includes('format=')) {
                    url += '&format=JSON';
                }
            }
            
            const response = await fetch(url);
            
            const result = {
                query: query.name,
                url: url,
                status: 'success',
                message: '',
                details: {}
            };
            
            if (!response.ok) {
                result.status = 'error';
                result.message = `HTTP ${response.status}: ${response.statusText}`;
            } else {
                const contentType = response.headers.get('content-type');
                
                if (!contentType || !contentType.includes('application/json')) {
                    result.status = 'warning';
                    result.message = 'Response is not JSON';
                } else {
                    try {
                        const data = await response.json();
                        
                        if (data.articles) {
                            result.details.articleCount = data.articles.length;
                            result.message = `Success: ${data.articles.length} articles`;
                        } else if (data.timeline) {
                            result.details.timelinePoints = data.timeline.length;
                            result.message = `Success: ${data.timeline.length} timeline points`;
                        } else {
                            result.status = 'warning';
                            result.message = 'Unknown data structure';
                        }
                        
                        if (result.details.articleCount === 0 && result.details.timelinePoints === 0) {
                            result.status = 'warning';
                            result.message = 'No results returned';
                        }
                    } catch (e) {
                        result.status = 'error';
                        result.message = 'Invalid JSON: ' + e.message;
                    }
                }
            }
            
            results.push(result);
            
        } catch (error) {
            results.push({
                query: query.name,
                url: query.url,
                status: 'error',
                message: error.message,
                details: {}
            });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    displayQAResults(results);
    showStatus('QA tests completed', 3000);
}

// Display QA test results
function displayQAResults(results) {
    const container = document.getElementById('qaResults');
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    let html = `
        <div class="mb-3">
            <strong>Test Summary:</strong>
            <span class="badge bg-success ms-2">${successCount} Passed</span>
            <span class="badge bg-warning ms-2">${warningCount} Warnings</span>
            <span class="badge bg-danger ms-2">${errorCount} Failed</span>
        </div>
    `;
    
    results.forEach(result => {
        html += `
            <div class="qa-item ${result.status}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="qa-status ${result.status}">
                            ${result.status === 'success' ? '✓' : result.status === 'error' ? '✗' : '⚠'}
                        </span>
                        <strong>${result.query}</strong>
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">${result.message}</small>
                </div>
                ${result.status === 'error' ? `<div class="mt-2"><small class="text-danger">URL: ${result.url}</small></div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

