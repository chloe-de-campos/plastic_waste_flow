// Flow arrows component with improved gradient styling
function createFlowArrows(containerId, flowData, projection) {
    const svg = d3.select(`#${containerId} svg`);
    const flowGroup = svg.append('g').attr('class', 'flow-arrows');
    
    const originColor = "#2166ac";
    const destColor = "#b2182b";
    
    const defs = svg.append('defs');
    let currentData = flowData || [];
    console.log("arrows loading...");
    
    // Country coordinates (rough centroids)
    const countryCoordinates = {
        "USA": [-98, 39], "CHN": [104, 35], "DEU": [10, 51], "JPN": [138, 36],
        "MYS": [101, 4], "THA": [100, 15], "VNM": [108, 14], "IDN": [113, -0.5],
        "GBR": [-3, 55], "FRA": [2, 46], "NLD": [5, 52], "BEL": [4, 50],
        "CAN": [-106, 56], "ITA": [13, 41], "AUS": [133, -27], "MEX": [-102, 23],
        "ESP": [-4, 40], "KOR": [127, 37], "IND": [78, 20], "TUR": [35, 39],
        "HKG": [114, 22], "TWN": [121, 24], "PHL": [121, 13], "PAK": [70, 30],
        "POL": [19, 52], "BRA": [-55, -10], "ARG": [-64, -34], "ZAF": [22, -31],
        "RUS": [105, 61], "DZA": [1, 28], "ALB": [20, 41], "BGR": [25, 43],
        "HRV": [15, 45], "CZE": [15, 50], "DNK": [9, 56], "EST": [26, 59],
        "FIN": [26, 61], "GRC": [22, 39], "HUN": [20, 47], "IRL": [-8, 53],
        "LVA": [25, 57], "LTU": [24, 56], "LUX": [6, 50], "MLT": [14, 36],
        "NOR": [8, 60], "PRT": [-8, 39], "ROU": [25, 46], "SVK": [19, 49],
        "SVN": [15, 46], "SWE": [18, 60], "CHE": [8, 47], "AUT": [14, 47],
        "ARE": [54, 24], "SAU": [45, 24], "ISR": [35, 31], "JOR": [36, 31],
        "LBN": [36, 34], "KWT": [48, 29], "EGY": [30, 26], "MAR": [-7, 32],
        "NGA": [8, 10], "KEN": [38, -1], "GHA": [-2, 8], "TZA": [35, -6],
        "CIV": [-5, 8], "SEN": [-14, 14], "TUN": [9, 34], "MOZ": [35, -18],
        "ETH": [40, 9], "UGA": [32, 1], "CMR": [12, 7], "ZWE": [30, -20],
        "NZL": [174, -41], "PNG": [144, -6], "FJI": [175, -16], "CHL": [-71, -30],
        "COL": [-74, 4], "PER": [-76, -10], "ECU": [-78, -1], "VEN": [-67, 6],
        "BOL": [-63, -17], "PRY": [-58, -23], "URY": [-56, -33], "SGP": [104, 1]
    };
    
    function calculateNetTrade(data) {
        const countryNetTrade = {};
        data.forEach(flow => {
            countryNetTrade[flow.source_country] = (countryNetTrade[flow.source_country] || 0) + (flow.weight_kg || 0);
            countryNetTrade[flow.target_country] = (countryNetTrade[flow.target_country] || 0) - (flow.weight_kg || 0);
        });
        return countryNetTrade;
    }
    
    function update(newFlowData, transform) {
        if (newFlowData) currentData = newFlowData;
        if (!currentData || currentData.length === 0) {
            flowGroup.selectAll('.flow-arrow').remove();
            if(window.state.map) window.state.map.updateCountryColors({});
            return;
        }
        
        // const netTrade = calculateNetTrade(currentData);
        // if(window.state.map) window.state.map.updateCountryColors(netTrade);

        const valueExtent = d3.extent(currentData, d => d.weight_kg || 0);
        const thicknessScale = d3.scaleSqrt().domain([0, valueExtent[1]]).range([0.5, 8]);
        const opacityScale = d3.scaleLinear().domain(valueExtent).range([0.5, 0.8]);
        
        // Filter out flows where we don't have coordinates for both countries
        const flowsToShow = currentData.filter(d => 
            countryCoordinates[d.source_country] && countryCoordinates[d.target_country] && d.weight_kg > 0
        );

        defs.selectAll('linearGradient').remove();
        flowsToShow.forEach((d, i) => {
            const g = defs.append('linearGradient').attr('id', `g-${i}`);
            g.append('stop').attr('offset', '0%').attr('stop-color', originColor);
            g.append('stop').attr('offset', '100%').attr('stop-color', destColor);
        });

        const arrows = flowGroup.selectAll('path').data(flowsToShow, d => `${d.source_country}-${d.target_country}`);
        arrows.exit().remove();
        
        arrows.enter().append('path').attr('class', 'flow-arrow')
            .merge(arrows)
            .attr('stroke', (d,i) => `url(#g-${i})`)
            .attr('stroke-opacity', d => opacityScale(d.weight_kg || 0))
            .attr('stroke-width', d => thicknessScale(d.weight_kg || 0))
            .attr('fill', 'none')
            .attr('d', d => {
                // Get coordinates from our lookup table
                const sourceCoords = countryCoordinates[d.source_country];
                const targetCoords = countryCoordinates[d.target_country];
                
                if (!sourceCoords || !targetCoords) {
                    console.warn(`Missing coordinates for ${d.source_country} or ${d.target_country}`);
                    return null;
                }
                
                let source = projection(sourceCoords);
                let target = projection(targetCoords);
                
                if (transform) {
                    source = transform.apply(source);
                    target = transform.apply(target);
                }
                
                const dx = target[0] - source[0];
                const dy = target[1] - source[1];
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
            });
    }

    if (flowData) update(flowData);
    
    return { update };
}

