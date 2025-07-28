function createCountrySummaryChart() {
    let currentView = 'exports'; // 'exports', 'imports', 'net'
    
    function updateChart(allData, currentYear) {
        const container = d3.select('#country-summary-chart');
        container.selectAll('*').remove();
        
        if (!allData || Object.keys(allData).length === 0) return;
        
        // Process data by year and country
        const yearlyData = {};
        Object.keys(allData).forEach(year => {
            yearlyData[year] = processYearData(allData[year]);
        });
        
        const years = Object.keys(yearlyData).map(Number).sort();
        const countries = getTopCountries(yearlyData);
        
        drawChart(container, yearlyData, years, countries, currentYear);
    }
    
    function processYearData(yearData) {
        const countryStats = {};
        
        yearData.forEach(flow => {
            const weight = flow.weight_kg || 0;
            
            if (!countryStats[flow.source_country]) {
                countryStats[flow.source_country] = { exports: 0, imports: 0, name: flow.source_name || flow.source_country };
            }
            if (!countryStats[flow.target_country]) {
                countryStats[flow.target_country] = { exports: 0, imports: 0, name: flow.target_name || flow.target_country };
            }
            
            countryStats[flow.source_country].exports += weight;
            countryStats[flow.target_country].imports += weight;
        });
        
        return countryStats;
    }
    
    function getTopCountries(yearlyData) {
        const countrySums = {};
        
        Object.values(yearlyData).forEach(yearData => {
            Object.keys(yearData).forEach(country => {
                if (!countrySums[country]) countrySums[country] = 0;
                countrySums[country] += yearData[country].exports + yearData[country].imports;
            });
        });
        
        return Object.entries(countrySums)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([country]) => country);
    }
    
    function drawChart(container, yearlyData, years, countries, currentYear) {
        // Adjust dimensions to make room for legend
        const margin = { top: 30, right: 50, bottom: 70, left: 90 };
        const width = 900 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        const legendWidth = 250;

        // Create main container
        const mainContainer = container.append('div')
            .style('display', 'flex')
            .style('align-items', 'flex-start')
            .style('gap', '20px');

        // Chart container
        const chartContainer = mainContainer.append('div');
        
        const svg = chartContainer.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('background', 'transparent');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Legend container
        const legendContainer = mainContainer.append('div')
            .style('width', legendWidth + 'px')
            .style('margin-top', '30px');

        // Prepare all data points
        const allDataPoints = [];
        countries.forEach(country => {
            years.forEach(year => {
                const data = yearlyData[year]?.[country];
                if (!data) return;
                let value;
                switch(currentView) {
                    case 'exports': value = data.exports; break;
                    case 'imports': value = data.imports; break;
                    case 'net': value = data.exports - data.imports; break;
                    default: value = 0;
                }
                allDataPoints.push({ year, value: value / 1000000, country });
            });
        });

        // Scales
        const values = allDataPoints.map(d => d.value).filter(v => v !== undefined && !isNaN(v));
        const minValue = Math.min(0, d3.min(values) || 0);
        const maxValue = Math.max(0, d3.max(values) || 1);
        
        const yScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([height, 0]);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, width]);

        // Use your theme colors
        const colorScale = d3.scaleOrdinal([
            '#3b82f6', // primary blue
            '#ef4444', // accent red/orange
            '#10b981', // emerald
            '#f59e0b', // amber
            '#8b5cf6', // violet
            '#06b6d4', // cyan
            '#84cc16', // lime
            '#f97316'  // orange
        ]);

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX)
            .defined(d => !isNaN(d.value));

        // Store country info for legend
        const countryInfo = [];
        
        // Draw lines for each country
        countries.forEach((country, i) => {
            const countryData = years.map(year => {
                const data = yearlyData[year]?.[country];
                if (!data) return null;
                let value;
                switch(currentView) {
                    case 'exports': value = data.exports; break;
                    case 'imports': value = data.imports; break;
                    case 'net': value = data.exports - data.imports; break;
                    default: value = 0;
                }
                return { year, value: value / 1000000 };
            }).filter(d => d !== null && !isNaN(d.value));
            
            if (countryData.length === 0) return;
            
            const path = g.append('path')
                .datum(countryData)
                .attr('fill', 'none')
                .attr('stroke', colorScale(i))
                .attr('stroke-width', 2.5)
                .attr('opacity', 0.9)
                .attr('d', line)
                .attr('class', `country-line-${i}`)
                .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))')
                .style('cursor', 'pointer');

            // Store info for legend
            const countryName = yearlyData[years[years.length-1]]?.[country]?.name || country;
            const lastValue = countryData[countryData.length - 1]?.value || 0;
            
            countryInfo.push({
                index: i,
                country,
                name: countryName,
                color: colorScale(i),
                value: lastValue,
                path
            });
        });

        // Create legend
        const legend = legendContainer.append('div')
            .style('background', 'rgba(30, 41, 59, 0.8)')
            .style('border', '1px solid rgba(255, 255, 255, 0.1)')
            .style('border-radius', '12px')
            .style('padding', '20px');

        legend.append('h4')
            .style('margin', '0 0 15px 0')
            .style('color', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Countries');

        const legendItems = legend.selectAll('.legend-item')
            .data(countryInfo)
            .enter()
            .append('div')
            .attr('class', 'legend-item')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '10px')
            .style('padding', '8px 12px')
            .style('margin-bottom', '4px')
            .style('border-radius', '6px')
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease')
            .on('mouseenter', function(event, d) {
                // Highlight this line
                g.selectAll('path').attr('opacity', 0.2);
                d.path.attr('opacity', 1).attr('stroke-width', 4);
                
                // Highlight legend item
                d3.select(this)
                    .style('background', 'rgba(255, 255, 255, 0.1)')
                    .style('transform', 'translateX(4px)');
            })
            .on('mouseleave', function(event, d) {
                // Reset all lines
                g.selectAll('path').attr('opacity', 0.9).attr('stroke-width', 2.5);
                
                // Reset legend item
                d3.select(this)
                    .style('background', 'transparent')
                    .style('transform', 'translateX(0px)');
            });

        // Color circles
        legendItems.append('div')
            .style('width', '12px')
            .style('height', '12px')
            .style('border-radius', '50%')
            .style('background', d => d.color)
            .style('flex-shrink', '0');

        // Country names
        legendItems.append('div')
            .style('color', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '13px')
            .style('font-weight', '500')
            .style('flex-grow', '1')
            .text(d => d.name);

        // Values
        legendItems.append('div')
            .style('color', 'rgba(255, 255, 255, 0.6)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '11px')
            .style('text-align', 'right')
            .text(d => {
                if (d.value >= 1000) return `${(d.value/1000).toFixed(1)}B`;
                if (d.value >= 1) return `${d.value.toFixed(0)}M`;
                return `${(d.value*1000).toFixed(0)}K`;
            });

        // Zero line for net trade
        if (currentView === 'net' && minValue < 0) {
            g.append('line')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', yScale(0))
                .attr('y2', yScale(0))
                .attr('stroke', 'rgba(255, 255, 255, 0.3)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3');
        }

        // Current year indicator
        if (years.includes(currentYear)) {
            g.append('line')
                .attr('x1', xScale(currentYear))
                .attr('x2', xScale(currentYear))
                .attr('y1', 0)
                .attr('y2', height)
                .attr('stroke', '#ef4444')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4')
                .attr('opacity', 0.8);
        }

        // X-axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickFormat(d3.format('d'))
                .ticks(Math.min(years.length, 12))
            )
            .selectAll('text')
            .style('fill', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px');

        // Y-axis
        g.append('g')
            .call(d3.axisLeft(yScale)
                .ticks(8)
                .tickFormat(d => {
                    if (Math.abs(d) >= 1000) {
                        return `${(d/1000).toFixed(0)}B kg`;
                    } else if (Math.abs(d) >= 1) {
                        return `${d.toFixed(0)}M kg`;
                    } else if (Math.abs(d) >= 0.01) {
                        return `${(d*1000).toFixed(0)}K kg`;
                    } else {
                        return `${d.toFixed(2)}M kg`;
                    }
                })
            )
            .selectAll('text')
            .style('fill', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px');

        // Style axis lines
        g.selectAll('.domain')
            .style('stroke', 'rgba(255, 255, 255, 0.2)');
        
        g.selectAll('.tick line')
            .style('stroke', 'rgba(255, 255, 255, 0.1)');

        // Y-axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 20)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('font-family', 'Inter, sans-serif')
            .style('fill', 'rgba(255, 255, 255, 0.7)')
            .text('Plastic Waste');
    }
    
    // Handle view switching
    d3.selectAll('.chart-toggle').on('click', function() {
        d3.selectAll('.chart-toggle').classed('active', false);
        d3.select(this).classed('active', true);
        currentView = this.dataset.view;
        if (window.state && window.state.data && window.state.currentYear) {
            updateChart(window.state.data, window.state.currentYear);
        }
    });
    
    return { updateChart };
}

console.log("✅ countrySummary.js loaded, createCountrySummaryChart available:", typeof createCountrySummaryChart);