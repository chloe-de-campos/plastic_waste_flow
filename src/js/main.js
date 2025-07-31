console.log("main.js loaded - starting - woppy");

// Main entry point for the visualization
window.state = {};

console.log("About to define init function");




async function init() {
    console.log("🚀 INIT FUNCTION CALLED!");
    
    try {

        // Add this to your main.js - make sure these are globally accessible
        window.state = {
            worldData: null,
            currentYear: 2002,
            netTradeData: {},
            currentFlows: [],
            mapInstance: null,
            modalMapInstance: null
        };
        // Step 1: Load data first
        console.log("📊 Loading data...");
        const worldData = await d3.json('https://unpkg.com/world-atlas@2/countries-110m.json');
        const flowData = await d3.json('data/plastic_waste_flows2.json');
        console.log("✅ Data loaded successfully");
        
        // Step 2: Set up basic state
        window.state.data = flowData;
        window.state.worldData = worldData;
        window.worldData = worldData;
        const years = Object.keys(flowData).map(Number).sort((a, b) => a - b);
        window.state.currentYear = years[0];
        
        console.log("📅 Years available:", years);
        
        // Step 3: Initialize Sankey FIRST (before anything tries to update them)
        console.log("📈 Initializing Sankey/Charts...");
        if (typeof initSankey === 'function') {
            window.state.charts = initSankey();
            console.log("✅ Sankey/Charts initialized");
            // Call timeline chart update with all data
        
        } else {
            console.error("❌ initSankey function not found");
        }
        
        
        // Step 3.5: Initialize Country Summary Chart with retry logic
        function initCountrySummaryWithRetry(attempt = 1, maxAttempts = 5) {
            console.log(`🔍 Attempt ${attempt} to initialize country summary chart...`);
            
            if (typeof createCountrySummaryChart === 'function') {
                console.log("✅ Creating country summary chart...");
                window.state.countrySummary = createCountrySummaryChart();
                window.state.countrySummary.updateChart(flowData, years[0]);
                console.log("✅ Country summary chart initialized successfully");
            } else if (attempt < maxAttempts) {
                console.log(`⏳ Function not ready, retrying in 100ms (attempt ${attempt}/${maxAttempts})...`);
                setTimeout(() => initCountrySummaryWithRetry(attempt + 1, maxAttempts), 100);
            } else {
                console.error("❌ createCountrySummaryChart function not found after", maxAttempts, "attempts");
                console.error("Available functions:", Object.keys(window).filter(key => typeof window[key] === 'function'));
            }
        }

        initCountrySummaryWithRetry();


        
        // Step 4: Initialize map components
        console.log("🗺️ Initializing map...");
        window.state.map = createWorldMap(worldData, 'map-container');
        window.state.flowArrows = createFlowArrows('map-container', flowData[years[0]], window.state.map.projection);
        console.log("✅ Map components initialized");
        
        
        // Step 6: Initialize filters (this will trigger the first update)
        // console.log("🔍 Initializing filters...");
        // window.state.filters = initFilters(flowData, updateVisualizationWithFilteredData);
        
        window.state.years = Object.keys(flowData).map(Number).sort((a, b) => a - b);
        window.state.currentYear = window.state.years[0];

        // Initialize the slider, passing the update function
        window.state.slider = initYearSlider(window.state.years, (year) => {
            window.state.currentYear = year;
            updateVisualization(); // This will trigger filters.applyFilters
        });

        // In your main.js init() function, add this after the slider initialization:

        // Initialize year annotations
        setTimeout(() => {
            if (typeof initYearAnnotations === 'function') {
                initYearAnnotations();
            }
        }, 2000); // Wait for everything else to load first

        // Step 7: Do initial update with first year's data
        console.log("🔄 Performing initial update...");
        const initialData = flowData[years[0]] || [];
        updateVisualizationWithFilteredData(initialData);
        
        // Step 8: Set up play button
        d3.select('#play-button').on('click', toggleAnimation);

        initInteractiveInsights();
        createMapLegend('map-legend');

        // Add this to your main.js init() function, after the map is created:

        // Initialize country labels
        console.log("🏷️ Initializing country labels...");
        window.state.countryLabels = createCountryLabels();

        

        // Also attach to modal map when it's created (in your modal code)
        // window.state.countryLabels.attachToMap(modalMapInstance);

         // Initialize modals AFTER everything is loaded
        const countryDetails = new CountryDetails();
        const chartModals = new ChartModals();
        window.chartModals = chartModals; // Make it globally accessible

        console.log("🎉 Initialization complete!woop");


    } catch (error) {
        console.error('❌ Error in init:', error);
        d3.select('#map-container').text('Failed to load data.');
    }
}

// New function to handle filtered data updates
function updateVisualizationWithFilteredData(filteredData) {
    console.log("🔄 Updating visualization with", filteredData.length, "flows");
    
    // Update flow arrows
    if (window.state.flowArrows) {
        window.state.flowArrows.update(filteredData);
    }
    

    // Update Sankey/Charts (with safety check)
    if (window.state.charts && window.state.charts.updateSankey) {
        console.log("📈 Updating Sankey/Charts...");
        window.state.charts.updateSankey(filteredData);
    } else {
        console.log("⚠️ Sankey/Charts not ready for update");
    }
    
    // Calculate net trade values for country coloring
    const netTradeValues = {};
    filteredData.forEach(flow => {
        if (!netTradeValues[flow.source_country]) {
            netTradeValues[flow.source_country] = 0;
        }
        netTradeValues[flow.source_country] += flow.trade_value;
        
        if (!netTradeValues[flow.target_country]) {
            netTradeValues[flow.target_country] = 0;
        }
        netTradeValues[flow.target_country] -= flow.trade_value;
    });
    
    // Update map colors
    if (window.state.map && window.state.map.updateCountryColors) {
        window.state.map.updateCountryColors(netTradeValues);
    }
}

// Keep your existing updateVisualization function
function updateVisualization() {
    // if (window.state.filters) {
    //     window.state.filters.applyFilters();
    // }
}

// Keep all your existing animation functions...
let animationInterval = null;
let isPlaying = false;

function toggleAnimation() {
    if (isPlaying) {
        stopAnimation();
    } else {
        startAnimation();
    }
}

function startAnimation() {
    if (isPlaying) return;
    
    isPlaying = true;
    d3.select('#play-button').html('<i class="fas fa-pause"></i>');
    
    const years = Object.keys(window.state.data).map(Number).sort((a, b) => a - b);
    let currentIndex = years.indexOf(window.state.currentYear);
    
    if (currentIndex >= years.length - 1) {
        currentIndex = -1;
    }
    
    animationInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= years.length) {
            stopAnimation();
            return;
        }
        
        const year = years[currentIndex];
        window.state.currentYear = year;
        d3.select('#year-slider input').property('value', year);
        d3.select('#year-display').text(year);
        
        // if (window.state.filters) {
        //     window.state.filters.applyFilters();
        // }
    }, 1500);
}

function stopAnimation() {
    if (!isPlaying) return;
    
    clearInterval(animationInterval);
    isPlaying = false;
    d3.select('#play-button').html('<i class="fas fa-play"></i>');
}

// Add this function to your main.js or in the countrySummary.js
function animateYearChange() {
    // Pulse effect on all year displays
    d3.selectAll('.current-year-display, .year-box')
        .classed('updating', true)
        .transition()
        .duration(300)
        .on('end', function() {
            d3.select(this).classed('updating', false);
        });
    
    // Briefly highlight connecting lines
    d3.selectAll('.chart-panel')
        .style('--connection-opacity', '1')
        .transition()
        .duration(1000)
        .style('--connection-opacity', '0.6');
}




console.log("Setting up DOMContentLoaded listener");

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎯 DOMContentLoaded fired - calling init");
    init();
});

if (document.readyState !== 'loading') {
    console.log("📄 Document already ready - calling init immediately");
    init();
}

console.log("main.js finished loading");


// Add this to your main.js file
function initInteractiveInsights() {
    const insights = [
        {
            id: 'china-ban',
            title: "China's Import Ban (2018)",
            year: 2018,
            countries: ['CHN'],
            description: "China's 'National Sword' policy shifted 45% of global plastic waste flows to Southeast Asia overnight."
        },
        {
            id: 'wealthy-exporters',
            title: "Wealthy Exporters",
            countries: ['USA', 'DEU', 'GBR', 'JPN'],
            description: "High-income countries consistently export the most plastic waste, often to countries with limited processing infrastructure."
        },
        {
            id: 'regional-shifts',
            title: "Regional Shifts",
            year: 2019,
            countries: ['MYS', 'VNM', 'THA'],
            description: "Post-2018 flows redirected to Malaysia, Vietnam, and Thailand, many of which later imposed their own restrictions."
        }
    ];

    insights.forEach(insight => {
        const card = document.querySelector(`[data-insight="${insight.id}"]`) || 
                    document.querySelector('.insight-card');
        
        if (card) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                // Jump to specific year if defined
                if (insight.year) {
                    window.state.currentYear = insight.year;
                    d3.select('#year-display').text(insight.year);
                    // if (window.state.filters) {
                    //     window.state.filters.applyFilters();
                    // }
                }
                
                // Highlight specific countries
                if (insight.countries) {
                    insight.countries.forEach(country => {
                        if (window.state.map && window.state.map.highlightCountry) {
                            window.state.map.highlightCountry(country, true);
                            setTimeout(() => {
                                window.state.map.highlightCountry(country, false);
                            }, 3000);
                        }
                    });
                }
                
                // Visual feedback
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
            });
        }
    });
}