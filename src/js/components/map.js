console.log("map.js loading...");

const alpha3ToNumeric = {
        "USA": "840", "CHN": "156", "DEU": "276", "JPN": "392",
        "MYS": "458", "THA": "764", "VNM": "704", "IDN": "360", "GBR": "826",
        "FRA": "250", "NLD": "528", "BEL": "056", "CAN": "124", "ITA": "380",
        "AUS": "036", "MEX": "484", "ESP": "724", "KOR": "410", "IND": "356",
        "TUR": "792", "HKG": "344", "TWN": "158", "PHL": "608", "PAK": "586",
        "POL": "616", "BRA": "076", "ARG": "032", "ZAF": "710", "RUS": "643",
        
        // Add these missing countries:
        "DZA": "012", "ALB": "008", "BGR": "100", "HRV": "191", "CZE": "203",
        "DNK": "208", "EST": "233", "FIN": "246", "GRC": "300", "HUN": "348",
        "IRL": "372", "LVA": "428", "LTU": "440", "LUX": "442", "MLT": "470",
        "NOR": "578", "PRT": "620", "ROU": "642", "SVK": "703", "SVN": "705",
        "SWE": "752", "CHE": "756", "AUT": "040", "ARE": "784", "SAU": "682",
        "ISR": "376", "JOR": "400", "LBN": "422", "KWT": "414", "EGY": "818",
        "MAR": "504", "NGA": "566", "KEN": "404", "GHA": "288", "TZA": "834",
        "CIV": "384", "SEN": "686", "TUN": "788", "MOZ": "508", "ETH": "231",
        "UGA": "800", "CMR": "120", "ZWE": "716", "NZL": "554", "PNG": "598",
        "FJI": "242", "CHL": "152", "COL": "170", "PER": "604", "ECU": "218",
        "VEN": "862", "BOL": "068", "PRY": "600", "URY": "858", "SGP": "702"
    };


// ... rest of your map.js code
// World map component
function createWorldMap(worldData, containerId) {
    console.log("Creating world map...");
    const container = d3.select(`#${containerId}`);
    const containerNode = container.node();
    const rect = containerNode.getBoundingClientRect();
    const width = Math.max(600, rect.width || 600); // Minimum width
    const height = 400; // Fixed height for consistency
    
        // Clear any existing content
    container.selectAll("*").remove();

    // Expanded country code mapping - we can add more countries as needed
    
    
    // Reverse mapping from numeric to alpha3
    const numericToAlpha3 = {};
    Object.entries(alpha3ToNumeric).forEach(([alpha3, numeric]) => {
        numericToAlpha3[numeric] = alpha3;
    });

        // Create a vintage-style map with subtle colors
    const svg = container.append('svg')
            .attr('width', '100%') // Ensure it takes full width of its parent
            .attr('height', '100%') // Ensure it takes full height of its parent
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('max-width', '100%')
            .style('height', '100%')
            .style('background', 'transparent'); // Let the parent panel's background show
const defs = svg.append('defs');

    // Add a drop shadow filter for hover effects (keep this, it's good)
    const dropShadow = defs.append('filter')
        .attr('id', 'drop-shadow')
        .attr('height', '130%');

    dropShadow.append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 2)
        .attr('result', 'blur');

    dropShadow.append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('result', 'offsetBlur');

    const feMerge = dropShadow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offsetBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const mapGroup = svg.append('g');

    // Use Natural Earth projection (keep this)
    const projection = d3.geoNaturalEarth1()
        .scale(width / 6)
        .center([0, 15])
        .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Draw oceans - change to a darker, subtle blue
    mapGroup.append('path')
        .datum({type: 'Sphere'})
        .attr('class', 'ocean')
        .attr('d', pathGenerator)
        .attr('fill', '#1a365d') // Darker blue for oceans
        .attr('stroke', 'none');

    // Draw graticule with vintage styling - make it lighter and more subtle
    const graticule = d3.geoGraticule().step([15, 15]);
    
    mapGroup.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', pathGenerator)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)') // Very light, subtle grid
        .attr('stroke-width', 0.3)
        .attr('stroke-dasharray', '1,2')
        .attr('stroke-opacity', 0.8); // Slightly increase opacity for visibility

    const participatingCountries = new Set(Object.values(alpha3ToNumeric));
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    // Default neutral color for countries - a muted gray/blue on dark
    const neutralColor = "#7893bb"; // From your neutral-700
    
    // Colors for exporters and importers - adjust to match your new palette
    // These are the *initial* colors, updateCountryColors will refine them
    const exporterColor = "rgba(59, 130, 246, 0.3)";  // Light blue for exporters (translucent)
    const importerColor = "rgba(249, 115, 22, 0.3)";  // Light orange for importers (translucent)

    // Draw countries with initial neutral styling
    const countryPaths = mapGroup.selectAll('path.country')
        .data(countries)
        .join('path')
        .attr('class', d => `country ${participatingCountries.has(d.id) ? 'highlighted' : ''}`)
        .attr('d', pathGenerator)
        .attr('fill', d => participatingCountries.has(d.id) ? neutralColor : '#7893bb') // Slightly lighter dark for non-involved countries
        .attr('stroke', '#3b3e42ff)') // Very subtle border for countries
        .attr('stroke-width', 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            // Find country name
            const alpha3 = numericToAlpha3[d.id];
                d3.select(this)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 2);
                
                // Show tooltip
                showCountryTooltip(event, d, alpha3, svg);
        
        })
        .on('mouseout', function(event, d) {
            
            const alpha3 = numericToAlpha3[d.id];
                d3.select(this)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 0);
                
                // Show tooltip
                showCountryTooltip(event, d, alpha3, svg);
        })
     
            

    // Set up pan and zoom with callback to update arrows
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            mapGroup.attr('transform', event.transform);
            
            // Update flow arrows if they exist
            if (window.state && window.state.flowArrows) {
                window.state.flowArrows.update(null, event.transform);
            }
        });

    svg.call(zoom);

    console.log("World map created successfully");

    // Function to update country colors based on net trade values
     function updateCountryColors(netTradeValues) {
        console.log("Updating country colors based on net trade");
        const values = Object.values(netTradeValues);
        if (values.length === 0) {
            // If no data, reset to neutral for participating countries
            countryPaths.transition()
                .duration(500)
                .attr('fill', function(d) {
                    return participatingCountries.has(d.id) ? neutralColor : '#7893bb';
                });
            return;
        }
        const extent = d3.extent(values);
        
        // Export color scale: from neutral-dark to primary-blue
        const exportColorScale = d3.scaleLinear()
            .domain([0, Math.max(extent[1], 1)])
            .range(["#7893bb", "#3b82f6"]) // From neutral to primary blue
            .clamp(true);

        // Import color scale: from accent-orange to neutral-dark
        const importColorScale = d3.scaleLinear()
            .domain([Math.min(extent[0], -1), 0])
            .range(["#ef4444", "#7893bb"]) // From a strong red/orange to neutral
            .clamp(true);

        countryPaths.transition()
            .duration(500)
            .attr('fill', function(d) {
                const alpha3 = numericToAlpha3[d.id];
                if (!alpha3 || !netTradeValues[alpha3]) {
                    return participatingCountries.has(d.id) ? neutralColor : '#7893bb';
                }
                const netValue = netTradeValues[alpha3];
                if (netValue > 0) {
                    return exportColorScale(netValue);
                } else if (netValue < 0) {
                    return importColorScale(netValue);
                } else {
                    return neutralColor;
                }
            });
    }

    return {
        svg,
        projection,
        updateCountryColors,
        highlightCountry(countryCode, highlight = true) {
            const numericId = alpha3ToNumeric[countryCode];
            if (!numericId) return;

            mapGroup.selectAll('.country')
                .filter(d => d.id === numericId)
                .transition()
                .duration(200)
                .attr('filter', highlight ? 'url(#drop-shadow)' : null)
                .attr('stroke-width', highlight ? 1 : 0.3);
        }
    };
}


// Add this to your map.js file
function createMapLegend(containerId) {
    const legend = d3.select(`#${containerId}`);
    legend.html('');
    
    const legendData = [
        { color: '#3b82f6', label: 'Net Exporters', description: 'Countries that export more than they import' },
        { color: '#64748b', label: 'Balanced Trade', description: 'Roughly equal imports and exports' },
        { color: '#ef4444', label: 'Net Importers', description: 'Countries that import more than they export' }
    ];
    
    const legendItems = legend.selectAll('.legend-item')
        .data(legendData)
        .join('div')
        .attr('class', 'legend-item')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '0.5rem')
        .style('margin-bottom', '0.5rem');
    
    legendItems.append('div')
        .style('width', '16px')
        .style('height', '16px')
        .style('border-radius', '3px')
        .style('background-color', d => d.color);
    
    legendItems.append('span')
        .style('font-size', '0.875rem')
        .style('font-weight', '500')
        .text(d => d.label);
}

function showCountryTooltip(event, d, alpha3, svg) {
    // const [x, y] = d3.pointer(event, svg.node());
    
    // const countryName = alpha3ToNumeric[alpha3] || alpha3;
    
    // const tooltip = svg.append('g')
    //     .attr('class', 'country-tooltip')
    //     .attr('transform', `translate(${x + 10}, ${y - 30})`);
    
    // const rect = tooltip.append('rect')
    //     .attr('fill', 'rgba(15, 23, 42, 0.95)')
    //     .attr('stroke', 'rgba(255, 255, 255, 0.2)')
    //     .attr('rx', 4);
    
    // const text = tooltip.append('text')
    //     .attr('fill', 'white')
    //     .attr('font-family', 'Inter, sans-serif')
    //     .attr('font-size', '12px')
    //     .attr('x', 8)
    //     .attr('y', 20)
    //     .text("country name" + countryName);
    
    // const bbox = text.node().getBBox();
    // rect.attr('width', bbox.width + 16)
    //     .attr('height', bbox.height + 12);
}

console.log("map.js loaded.");

