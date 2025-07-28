
console.log("fileters.js loading...");
// Filters component for the visualization
function initFilters(data, updateVisualization) {
    console.log("Initializing filters...");
    
    // Get all unique countries from the data
    const countries = new Set();
    const regions = {
        "north-america": ["USA", "CAN", "MEX"],
        "south-america": ["BRA", "ARG", "CHL", "COL", "PER", "ECU", "VEN", "BOL", "PRY", "URY"],
        "europe": ["DEU", "GBR", "FRA", "NLD", "BEL", "ITA", "ESP", "POL", "SWE", "CHE", "AUT", "NOR", "DNK", "FIN", "PRT", "GRC", "IRL", "HUN", "CZE", "ROU", "BGR"],
        "asia": ["CHN", "JPN", "KOR", "MYS", "THA", "VNM", "IDN", "IND", "TUR", "HKG", "TWN", "PHL", "PAK", "SGP", "SAU", "ARE", "ISR", "JOR", "LBN", "KWT"],
        "africa": ["ZAF", "EGY", "MAR", "NGA", "KEN", "GHA", "TZA", "CIV", "SEN", "TUN", "DZA", "MOZ", "ETH", "UGA", "CMR", "ZWE"],
        "oceania": ["AUS", "NZL", "PNG", "FJI"]
    };
    
    // Extract countries from all years of data
    Object.values(data).forEach(yearData => {
        yearData.forEach(flow => {
            countries.add({code: flow.source_country, name: flow.source_name});
            countries.add({code: flow.target_country, name: flow.target_name});
        });
    });
    
    // Sort countries by name
    // const sortedCountries = Array.from(countries)
    //     .filter((country, index, self) => 
    //         index === self.findIndex(c => c.code === country.code)
    //     )
    //     .sort((a, b) => a.name.localeCompare(b.name));
    
    // // Populate the country filter dropdown
    // const countryFilter = d3.select('#country-filter');
    // sortedCountries.forEach(country => {
    //     countryFilter.append('option')
    //         .attr('value', country.code)
    //         .text(country.name);
    // });
    
    // Set up event listeners for all filters
    d3.select('#region-filter').on('change', applyFilters);
    d3.select('#trade-filter').on('change', applyFilters);
    d3.select('#volume-filter').on('change', applyFilters);
    // d3.select('#country-filter').on('change', applyFilters);
    // In your initFilters function, make sure this line exists:
    d3.select('#reset-filters-button').on('click', resetFilters);

    // And make sure resetFilteroks is defined within the scope:
    function resetFilters() {
        d3.select('#region-filter').property('value', 'all');
        d3.select('#volume-filter').property('value', 'all');  
        // d3.select('#country-filter').property('value', 'all');
        
        // Trigger filter application after reset
        applyFilters();
    }
    
    function applyFilters() {
        const region = d3.select('#region-filter').property('value');
        const volumeThreshold = d3.select('#volume-filter').property('value');
        // const country = d3.select('#country-filter').property('value');
        
        // Get the current year's data
        const currentYearData = data[window.state.currentYear.toString()];
        if (!currentYearData) return;
        
        // Apply filters
        let filteredData = [...currentYearData];
        
        // Region filter
        if (region !== 'all') {
            const regionCountries = regions[region] || [];
            filteredData = filteredData.filter(flow => 
                regionCountries.includes(flow.source_country) || 
                regionCountries.includes(flow.target_country)
            );
        }
        
    // In the initFilters function, update the volume threshold filter section:

        // Volume threshold filter
        if (volumeThreshold !== 'all') {
            // Convert threshold values to numbers (assuming they're in kg)
            const threshold = parseInt(volumeThreshold);
            
            // Filter based on qty field (which should be in kg)
            filteredData = filteredData.filter(flow => {
                // Use qty from original data if available, otherwise fall back to trade_value
                const weight = flow.original && flow.original.qty ? flow.original.qty : flow.trade_value;
                return weight >= threshold;
            });
        }
        
        // // Volume threshold filter
        // if (volumeThreshold !== 'all') {
        //     // Calculate value thresholds
        //     const valueExtent = d3.extent(currentYearData, d => d.trade_value);
        //     const third = (valueExtent[1] - valueExtent[0]) / 3;
        //     const mediumThreshold = valueExtent[0] + third;
        //     const highThreshold = valueExtent[0] + 2 * third;
            
        //     if (volumeThreshold === 'high') {
        //         filteredData = filteredData.filter(flow => flow.trade_value >= highThreshold);
        //     } else if (volumeThreshold === 'medium') {
        //         filteredData = filteredData.filter(flow => flow.trade_value >= mediumThreshold);
        //     }
        // }
        
        // Call the provided update function with filtered data
        updateVisualization(filteredData);
    }

    // Initial application of filters
    applyFilters();
    
    // Return methods for external use
    return {
        applyFilters
    };
}


function resetFilters() {
d3.select('#region-filter').property('value', 'all');
d3.select('#volume-filter').property('value', 'all');
// d3.select('#country-filter').property('value', 'all');

// Trigger filter application after reset
applyFilters();
}

d3.select('#reset-filters-button').on('click', resetFilters);

console.log("fileters.js loaded.");