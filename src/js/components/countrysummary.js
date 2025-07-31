console.log("🔄 countrySummary.js file is loading...");

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
        // Get container dimensions and determine if mobile
        const containerElement = container.node();
        const containerRect = containerElement.getBoundingClientRect();
        const containerWidth = Math.max(280, containerRect.width || containerElement.offsetWidth || 320);
        
        const isMobile = containerWidth < 768;
        
        console.log('Container width:', containerWidth, 'isMobile:', isMobile);
        
        // Force the container to have proper CSS constraints
        container
            .style('width', '100%')
            .style('max-width', '100%')
            .style('box-sizing', 'border-box');
        
        // Add timeline interaction hints
        // const timelineHint = container.append('div')
        //     .style('text-align', 'center')
        //     .style('color', 'rgba(255, 255, 255, 0.7)')
        //     .style('font-size', '0.85rem')
        //     .style('margin-bottom', '10px')
        //     .style('font-style', 'italic')
        //     .style('background', 'rgba(59, 130, 246, 0.1)')
        //     .style('padding', '0.5rem 1rem')
        //     .style('border-radius', '20px')
        //     .style('border', '1px solid rgba(59, 130, 246, 0.3)')
        //     .html('<i class="fas fa-hand-pointer"></i> Click and drag on the timeline below through years');
        
        // Responsive dimensions with strict constraints
        const margin = {
            top: 20,
            right: isMobile ? 15 : 40,
            bottom: isMobile ? 60 : 80,
            left: isMobile ? 45 : 80
        };
        
        // Calculate available space more conservatively
        const padding = 20;
        const gap = 15;
        const availableWidth = containerWidth - padding;
        
        let chartWidth, legendWidth, shouldStack;
        
        if (isMobile || availableWidth < 600) {
            shouldStack = true;
            chartWidth = Math.min(availableWidth, 500);
            legendWidth = chartWidth;
        } else {
            shouldStack = false;
            legendWidth = Math.min(220, availableWidth * 0.28);
            chartWidth = availableWidth - legendWidth - gap;
            
            if (chartWidth < 350) {
                shouldStack = true;
                chartWidth = Math.min(availableWidth, 500);
                legendWidth = chartWidth;
            }
        }
        
        const height = isMobile ? 320 : 460;
        // In the drawChart function, modify the actual chart width calculation:
        const actualChartWidth = chartWidth - margin.left - margin.right - 20; // Add extra padding
        const actualChartHeight = height - margin.top - margin.bottom;
        
        console.log('Final layout:', { 
            containerWidth, 
            availableWidth,
            chartWidth, 
            legendWidth, 
            shouldStack,
            actualChartWidth,
            actualChartHeight
        });
        
        // Create integrated play/pause control
        const playControlContainer = container.append('div')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('gap', '1rem')
            .style('margin', '1rem 0');

       

        // Animation state
        let animationInterval = null;
        let isPlaying = false;
        
        // Create main container with strict boundaries
        const mainContainer = container.append('div')
            .style('display', 'flex')
            .style('flex-direction', shouldStack ? 'columnreverse' : 'row')
            .style('align-items', shouldStack ? 'center' : 'flex-start')
            .style('justify-content', 'space-around')
            .style('gap', `${gap}px`)
            .style('width', '100%')
            .style('max-width', `${availableWidth}px`)
            .style('margin', '0 auto')
            .style('padding', '0')
            .style('box-sizing', 'border-box')
            .style('overflow', 'hidden');

        // Chart container with strict width
        const chartContainer = mainContainer.append('div')
            .style('width', `${chartWidth}px`)
            .style('max-width', `${chartWidth*0.9}px`)
            .style('min-width', '0')
            .style('flex-shrink', '0')
            .style('overflow', 'hidden');
        
        // After creating the SVG element:
        const svg = chartContainer.append('svg')
            .attr('width', chartWidth)
            .attr('height', height)
            .attr('viewBox', `0 0 ${chartWidth} ${height}`) // Add viewBox for responsive scaling
            .style('display', 'block')
            .style('width', `${chartWidth}px`)
            .style('height', `${height}px`)
            .style('max-width', '100%')
            .style('overflow', 'visible'); // Change from hidden to visible for debugging

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Legend container with strict width
        const legendContainer = mainContainer.append('div')
            .style('width', `${legendWidth}px`)
            .style('max-width', `${legendWidth}px`)
            .style('min-width', '0')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('flex-direction', 'column')
            .style('overflow', 'hidden')
            .style('box-sizing', 'border-box')
            .style('margin-top', shouldStack ? '0' : '20px');

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

        // Scales using actual chart dimensions
        const values = allDataPoints.map(d => d.value).filter(v => v !== undefined && !isNaN(v));
        const minValue = Math.min(0, d3.min(values) || 0);
        const maxValue = Math.max(0, d3.max(values) || 1);
        
        const yScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([actualChartHeight, 0]);

        const xScale = d3.scaleLinear()
            .domain([d3.min(years), d3.max(years)]) // Use min/max instead of d3.extent
            .range([0, actualChartWidth]);

        // Color scale
        const colorScale = d3.scaleOrdinal([
            '#ff2469ff', '#ff72efff', '#10b981', '#f59e0b', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
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
                .attr('stroke-width', shouldStack ? 2 : 2.5)
                .attr('opacity', 0.9)
                .attr('d', line)
                .attr('class', `country-line-${i}`)
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

        // Timeline elements
        const timelineGroup = g.append('g')
            .attr('class', 'timeline-group');

        // Background timeline track
        const timelineY = actualChartHeight + 35;
        timelineGroup.append('line')
            .attr('class', 'timeline-track')
            .attr('x1', 0)
            .attr('x2', actualChartWidth)
            .attr('y1', timelineY)
            .attr('y2', timelineY)
            .attr('stroke', 'rgba(255, 255, 255, 0.2)')
            .attr('stroke-width', 3);

        // Progress indicator (filled portion)
        const currentXPos = xScale(currentYear);
        const progressLine = timelineGroup.append('line')
            .attr('class', 'timeline-progress')
            .attr('x1', 0)
            .attr('x2', currentXPos)
            .attr('y1', timelineY)
            .attr('y2', timelineY)
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3);

        // Current year indicator line
        const currentYearLine = timelineGroup.append('line')
            .attr('class', 'current-year-line')
            .attr('x1', currentXPos)
            .attr('x2', currentXPos)
            .attr('y1', 0)
            .attr('y2', actualChartHeight)
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8)
            .attr('stroke-dasharray', '4,4');

        // Draggable handle
        // When creating the handle, add these properties:
        const handle = timelineGroup.append('circle')
            .attr('class', 'timeline-handle')
            .attr('cx', currentXPos)
            .attr('cy', timelineY)
            .attr('r', isMobile ? 6 : 8)
            .attr('fill', '#3b82f6')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'grab')
            .style('pointer-events', 'all') // Ensure it receives pointer events
            .style('user-select', 'none'); // Prevent text selection during drag

        // // Year label
        // const yearLabel = timelineGroup.append('text')
        //     .attr('class', 'year-label')
        //     .attr('x', currentXPos)
        //     .attr('y', timelineY + 40)
        //     .attr('text-anchor', 'middle')
        //     .style('fill', '#3b82f6')
        //     .style('font-family', 'Inter, sans-serif')
        //     .style('font-size', '2rem')
        //     .style('font-weight', '600')
        //     .style('border-radius', '8px')
        //     .style('padding', '0.2rem 0.5rem')
        //     .style('background', 'var(--glass-bg)')

        //     .text(currentYear);
        // Replace the year label section with this:
        const yearLabelGroup = timelineGroup.append('g')
            .attr('class', 'year-label-group');

        // Background box for the year
        const yearBox = yearLabelGroup.append('rect')
            // .attr('class', 'year-box')
            // .attr('x', currentXPos - 25)
            // .attr('y', timelineY + 15)
            // .attr('width', 50)
            // .attr('height', 30)
            // .attr('rx', 6)
            // .attr('ry', 6)
            // .style('stroke', 'var(--glass-border)')
            // .style('stroke-width', 1)
                .attr('class', 'year-box')
                .attr('x', currentXPos - 25)
                .attr('y', timelineY + 15)
                .attr('width', 50)
                .attr('height', 30)
                .attr('rx', 6)
                .attr('ry', 6)

                .style('fill', 'None')  // Add the fill
                .style('stroke', 'white)')  // Change to white stroke
                .style('stroke-width', 1)
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

        // Year text
        const yearLabel = yearLabelGroup.append('text')
            .attr('class', 'year-label')
            .attr('x', currentXPos)
            .attr('y', timelineY + 35)
            .attr('text-anchor', 'middle')
            .style('fill', 'rgb(59, 130, 246)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', 'var(--font-size-2xl, 1.5rem)')
            .style('font-weight', '700')
            .style('pointer-events', 'none')
            .text(currentYear);
        
        // const yearLine = yearLabelGroup.append('line')
        //     .attr('class', 'year-connection-line')
        //     .attr('x1', currentXPos)
        //     .attr('x2', currentXPos)
        //     .attr('y1', timelineY + 45) // Start below the year box
        //     .attr('y2', timelineY + 80) // Extend downward
        //     .style('stroke', '#3b82f6')
        //     .style('stroke-width', 2)
        //     .style('opacity', 0.7)
        //     .style('stroke-dasharray', '4,2');

        // Store both elements in the indicator
        const currentYearIndicator = {
            line: currentYearLine,
            handle: handle,
            progress: progressLine,
            label: yearLabel,
            box: yearBox,
            // connectionLine: yearLine  // Add this
        };


        // Create drag behavior
        // Replace the createDragBehavior function with this improved version:

        function createDragBehavior() {
            let isDragging = false;
            
            const drag = d3.drag()
                .on('start', function(event) {
                    console.log('Drag started');
                    isDragging = true;
                    stopAnimation();
                    // updateYearArrow(window.state.currentYear);
                    // Prevent any other mouse events
                    event.sourceEvent.stopPropagation();
                    event.sourceEvent.preventDefault();
                    
                    d3.select(this)
                        .style('cursor', 'grabbing')
                        .transition()
                        .duration(100)
                        .attr('r', isMobile ? 8 : 10)
                        .attr('stroke-width', 3);
                })
                .on('drag', function(event) {
                    if (!isDragging) return;
                    
                    // Prevent default behavior
                    event.sourceEvent.stopPropagation();
                    event.sourceEvent.preventDefault();
                    
                    // Get mouse position relative to the chart group (g element)
                    const [mouseX] = d3.pointer(event, g.node());
                    
                    // Constrain to chart bounds
                    const constrainedX = Math.max(0, Math.min(actualChartWidth, mouseX));
                    
                    // Convert to year
                    const newYear = xScale.invert(constrainedX);
                    const clampedYear = Math.max(years[0], Math.min(years[years.length - 1], Math.round(newYear)));
                    
                    // Only update if year actually changed
                    // In the drag behavior, update the year display section:
                    // Only update if year actually changed
                    if (clampedYear !== window.state.currentYear) {
                        const xPos = xScale(clampedYear);
                        
                        // Update all timeline elements
                        currentYearIndicator.line
                            .attr('x1', xPos)
                            .attr('x2', xPos);
                        currentYearIndicator.handle
                            .attr('cx', xPos);
                        currentYearIndicator.progress
                            .attr('x2', xPos);
                        currentYearIndicator.label
                            .attr('x', xPos)
                            .text(clampedYear);
                        currentYearIndicator.box
                            .attr('x', xPos - 25); // Keep box centered on handle
                        // currentYearIndicator.connectionLine  // Add this
                        //     .attr('x1', xPos)
                        //     .attr('x2', xPos);

                        window.state.currentYear = clampedYear;

                        // updateYearArrow(clampedYear);
                    }
                })
                .on('end', function(event) {
                    console.log('Drag ended');
                    
                    // Prevent any other events
                    event.sourceEvent.stopPropagation();
                    event.sourceEvent.preventDefault();
                    
                    isDragging = false;
                    
                    d3.select(this)
                        .style('cursor', 'grab')
                        .transition()
                        .duration(100)
                        .attr('r', isMobile ? 6 : 8)
                        .attr('stroke-width', 2);
                    
                    // Update external elements
                    const externalSlider = d3.select('#year-slider input');
                    if (!externalSlider.empty()) {
                        externalSlider.property('value', window.state.currentYear);
                    }
                    d3.select('#year-display').text(window.state.currentYear);

                    if (window.state.filters) {
                        window.state.filters.applyFilters();
                    }

                });
            
            return { drag, isDragging: () => isDragging };
        }

        // Apply drag behavior
        const dragBehavior = createDragBehavior();
        currentYearIndicator.handle.call(dragBehavior.drag);

        // Year update function
        function updateYear(newYear, fromDrag = false) {
            const clampedYear = Math.max(years[0], Math.min(years[years.length - 1], Math.round(newYear)));
            
            // Always update window.state.currentYear
            window.state.currentYear = clampedYear;
            
            const xPos = xScale(clampedYear);
            
            currentYearIndicator.line
                .attr('x1', xPos)
                .attr('x2', xPos);
            currentYearIndicator.handle
                .attr('cx', xPos);
            currentYearIndicator.progress
                .attr('x2', xPos);
            currentYearIndicator.label
                .attr('x', xPos)
                .text(clampedYear);
            currentYearIndicator.box
                .attr('x', xPos - 25);
            // currentYearIndicator.connectionLine  // Add this
            //     .attr('x1', xPos)
            //     .attr('x2', xPos);

            if (!fromDrag) {
                const externalSlider = d3.select('#year-slider input');
                if (!externalSlider.empty()) {
                    externalSlider.property('value', clampedYear);
                }
                d3.select('#year-display').text(clampedYear);

                if (window.state.filters) {
                    window.state.filters.applyFilters();
                }
            }
            
            // Debug log
            console.log('updateYear called, window.state.currentYear is now:', window.state.currentYear);
        }

        // Animation functions
        function startAnimation() {
            if (isPlaying) return;
            isPlaying = true;
            
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
                updateYear(years[currentIndex], false);
            }, 1200);
        }
        
        function stopAnimation() {
            if (!isPlaying) return;
            clearInterval(animationInterval);
            isPlaying = false;
        }

        function toggleAnimation() {
            if (isPlaying) {
                stopAnimation();
            } else {
                startAnimation();
            }
        }

        // Chart interaction area (click to jump to year)
       // Replace the chart interaction area with this improved version:
        // const chartInteractionArea = g.append('rect')
        //     .attr('x', 0)
        //     .attr('y', -10)
        //     .attr('width', actualChartWidth)
        //     .attr('height', actualChartHeight + 60)
        //     .attr('fill', 'transparent')
        //     .style('cursor', 'pointer')
        //     .style('pointer-events', 'all') // Ensure it receives events
        //     .on('mousedown', function(event) {
        //         // Only handle if not dragging and not clicking on the handle
        //         if (dragBehavior.isDragging()) return;
                
        //         // Check if we clicked near the handle (within 15px radius)
        //         const [mouseX, mouseY] = d3.pointer(event, g.node());
        //         const handleX = xScale(window.state.currentYear);
        //         const handleY = actualChartHeight + 35; // timeline Y position
        //         const distanceToHandle = Math.sqrt(Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2));
                
        //         if (distanceToHandle <= 15) return; // Don't interfere with handle clicks
                
        //         stopAnimation();
                
        //         const constrainedX = Math.max(0, Math.min(actualChartWidth, mouseX));
        //         const newYear = xScale.invert(constrainedX);
        //         const clampedYear = Math.max(years[0], Math.min(years[years.length - 1], Math.round(newYear)));
                
        //         updateYear(clampedYear, false);
        //     });

        // Keyboard support
        container.node().setAttribute('tabindex', '0');
        container.on('keydown', function(event) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stopAnimation();
                const currentIndex = years.indexOf(window.state.currentYear);
                if (currentIndex > 0) {
                    updateYear(years[currentIndex - 1], false);
                }
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                stopAnimation();
                const currentIndex = years.indexOf(window.state.currentYear);
                if (currentIndex < years.length - 1) {
                    updateYear(years[currentIndex + 1], false);
                }
            } else if (event.key === ' ') {
                event.preventDefault();
                toggleAnimation();
            }
        });

        // Zero line for net trade
        if (currentView === 'net' && minValue < 0) {
            g.append('line')
                .attr('x1', 0)
                .attr('x2', actualChartWidth)
                .attr('y1', yScale(0))
                .attr('y2', yScale(0))
                .attr('stroke', 'rgba(255, 255, 255, 0.3)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3');
        }

        // X-axis
        g.append('g')
            .attr('transform', `translate(0,${actualChartHeight})`)
            .call(d3.axisBottom(xScale)
                .tickFormat(d3.format('d'))
                .ticks(shouldStack ? 5 : 8)
            )
            .selectAll('text')
            .style('fill', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '11px')
            .style('cursor', 'pointer');

        // Y-axis
        g.append('g')
            .call(d3.axisLeft(yScale)
                .ticks(shouldStack ? 4 : 6)
                .tickFormat(d => {
                    if (Math.abs(d) >= 1000) return `${(d/1000).toFixed(0)}B`;
                    else if (Math.abs(d) >= 1) return `${d.toFixed(0)}M`;
                    else if (Math.abs(d) >= 0.01) return `${(d*1000).toFixed(0)}K`;
                    else return `${d.toFixed(2)}M`;
                })
            )
            .selectAll('text')
            .style('fill', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '10px');

        // Style axis lines
        g.selectAll('.domain').style('stroke', 'rgba(255, 255, 255, 0.2)');
        g.selectAll('.tick line').style('stroke', 'rgba(255, 255, 255, 0.1)');

        // Y-axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left + 15)
            .attr('x', 0 - (actualChartHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('font-family', 'Inter, sans-serif')
            .style('fill', 'rgba(255, 255, 255, 0.7)')
            .text(shouldStack ? 'Exports (kg)' : 'Plastic Waste Exported (kg)');

        // Create legend
        const legend = legendContainer.append('div')
            .style('background', 'rgba(30, 41, 59, 0.8)')
            .style('border', '1px solid rgba(255, 255, 255, 0.1)')
            .style('border-radius', '8px')
            .style('padding', isMobile ? '7px' : (shouldStack ? '10px' : '12px'))
            .style('width', isMobile ? '80%' : '100%')
            .style('box-sizing', 'border-box')
            .style('overflow', 'hidden');

        legend.append('h4')
            .style('margin', isMobile ? '0 0 5px 0' : '0 0 8px 0')
            .style('color', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', isMobile ? '11px' : '13px')
            .style('font-weight', '600')
            .text('Countries');

        const legendItems = legend.selectAll('.legend-item')
            .data(countryInfo)
            .enter()
            .append('div')
            .attr('class', 'legend-item')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', isMobile ? '4px' : '6px')
            .style('padding', isMobile ? '3px 4px' : '4px 6px')
            .style('margin-bottom', isMobile ? '1px' : '2px')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease')
            .style('width', '100%')
            .style('height', isMobile ? '28px' : '32px')
            .style('box-sizing', 'border-box')
            .style('overflow', 'hidden')
            .on('mouseenter', function(event, d) {
                g.selectAll('path').attr('opacity', 0.2);
                d.path.attr('opacity', 1).attr('stroke-width', shouldStack ? 3 : 4);
                d3.select(this).style('background', 'rgba(255, 255, 255, 0.1)');
            })
            .on('mouseleave', function(event, d) {
                g.selectAll('path').attr('opacity', 0.9).attr('stroke-width', shouldStack ? 2 : 2.5);
                d3.select(this).style('background', 'transparent');
            });

        // Color circles
        legendItems.append('div')
            .style('width', '10px')
            .style('height', '10px')
            .style('border-radius', '50%')
            .style('background', d => d.color)
            .style('flex-shrink', '0');

        // Country names
        legendItems.append('div')
            .style('color', 'rgba(255, 255, 255, 0.9)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', isMobile ? '10px' : '11px')
            .style('font-weight', '500')
            .style('flex-grow', '1')
            .style('overflow', 'hidden')
            .style('text-overflow', 'ellipsis')
            .style('white-space', 'nowrap')
            .style('min-width', '0')
            .text(d => d.name);

        // Values
        legendItems.append('div')
            .style('color', 'rgba(255, 255, 255, 0.6)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', isMobile ? '8px' : '9px')
            .style('text-align', 'right')
            .style('flex-shrink', '0')
            .style('width', isMobile ? '28px' : '32px')
            .text(d => {
                if (d.value >= 1000) return `${(d.value/1000).toFixed(1)}B`;
                if (d.value >= 1) return `${d.value.toFixed(0)}M`;
                return `${(d.value*1000).toFixed(0)}K`;
            });

        

            // function updateYearArrow(year) {
            //     const arrow = document.getElementById('year-connection-arrow');
            //     if (!arrow) return;
                
            //     // Get the current year position from the chart
            //     const yearX = xScale(year);
                
            //     // Convert SVG coordinate to relative position within the panel
            //     const svgRect = svg.node().getBoundingClientRect();
            //     const panelRect = arrow.offsetParent.getBoundingClientRect();
                
            //     // Calculate the relative left position
            //     const relativeLeft = (yearX + margin.left) * (panelRect.width / svgRect.width);
                
            //     // Update arrow position
            //     arrow.style.left = `${relativeLeft}px`;
            //     arrow.classList.add('visible');
            // }

            // function hideYearArrow() {
            //     const arrow = document.getElementById('year-connection-arrow');
            //     if (arrow) {
            //         arrow.classList.remove('visible');
            //     }
            // }

        return {
            updateYear: updateYear,
            startAnimation: startAnimation,
            stopAnimation: stopAnimation,
            toggleAnimation: toggleAnimation
        };
    }

    // Handle view switching
    d3.selectAll('.chart-toggle').on('click', function() {
        d3.selectAll('.chart-toggle')
            .classed('active', false)
            .classed('btn-active', false);
        
        d3.select(this)
            .classed('active', true)
            .classed('btn-active', true);
        
        currentView = this.dataset.view;
        
        if (window.state && window.state.data && window.state.currentYear) {
            updateChart(window.state.data, window.state.currentYear);
        }
    });
    
    // Resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.state && window.state.data && window.state.currentYear) {
                updateChart(window.state.data, window.state.currentYear);
            }
        }, 250);
    });
    
    return { updateChart };
}

console.log("✅ countrySummary.js loaded, createCountrySummaryChart available:", typeof createCountrySummaryChart);

// src/js/components/yearAnnotations.js
console.log("yearAnnotations.js loading...");

function createYearAnnotations() {
    const annotations = {
        2013: {
            title: "Operation Green Fence",
            subtitle: "China Tightens Quality Standards",
            content: `
                <p>China launched "Operation Green Fence" - an intensive enforcement campaign that rejected plastic waste shipments with contamination above 0.5%.</p>
                <div class="annotation-stats">
                    <div class="stat-item">
                        <span class="stat-number">70%</span>
                        <span class="stat-label">containers inspected</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">22K</span>
                        <span class="stat-label">containers rejected</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">1M</span>
                        <span class="stat-label">tons reduced imports</span>
                    </div>
                </div>
                <p class="annotation-impact">This crackdown revealed the poor quality of global plastic waste exports and set the stage for even stricter measures.</p>
            `,
            sources: [
                {
                    title: "Resource Recycling: Green Fence Timeline",
                    url: "https://resource-recycling.com/plastics/2018/02/14/green-fence-red-alert-china-timeline/"
                },
                {
                    title: "University of Chicago: Chinese Recyclable Waste Restrictions",
                    url: "https://cjil.uchicago.edu/print-archive/waste-not-want-not-chinese-recyclable-waste-restrictions-their-global-impact-and"
                },
                {
                    title: "Waste360: What Operation Green Fence Meant",
                    url: "https://www.waste360.com/waste-management-business/what-operation-green-fence-has-meant-for-recycling"
                }
            ],
            color: "#f59e0b",
            icon: "🚧"
        },
        2018: {
            title: "National Sword Policy",
            subtitle: "China Bans Most Plastic Waste Imports",
            content: `
                <p>China implemented the "National Sword" policy, banning plastic waste with contamination above 0.05% - down from the previous 10% threshold.</p>
                <div class="annotation-stats">
                    <div class="stat-item">
                        <span class="stat-number">0.05%</span>
                        <span class="stat-label">max contamination</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">640%</span>
                        <span class="stat-label">Thailand import increase</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">273%</span>
                        <span class="stat-label">Malaysia import increase</span>
                    </div>
                </div>
                <p class="annotation-impact">This policy ended China's role as the world's largest waste importer and triggered a global recycling crisis as waste flows redirected to Southeast Asia.</p>
            `,
            sources: [
                {
                    title: "Yale E360: How China's Ban Stalled Global Recycling",
                    url: "https://e360.yale.edu/features/piling-up-how-chinas-ban-on-importing-waste-has-stalled-global-recycling"
                },
                {
                    title: "Towson University: National Sword vs The World",
                    url: "https://wp.towson.edu/iajournal/2020/07/02/chinese-national-sword-vs-the-world-the-green-silver-lining-in-our-global-recycling-crisis/"
                },
                {
                    title: "Wikipedia: China's Waste Import Ban",
                    url: "https://en.wikipedia.org/wiki/China's_waste_import_ban"
                }
            ],
            color: "#dc2626",
            icon: "⚔️"
        }
    };

    let currentAnnotation = null;
    let annotationContainer = null;

    function init() {
        // Create annotation container
        annotationContainer = d3.select('body')
            .append('div')
            .attr('class', 'year-annotation-container')
            .style('position', 'fixed')
            .style('z-index', '2000')
            .style('pointer-events', 'none')
            .style('opacity', '0');

        // Add CSS styles
        addAnnotationStyles();
        
        console.log("Year annotations initialized");
    }

    function addAnnotationStyles() {
        const styles = `
            <style>
                .year-annotation-container {
                    transition: all 0.3s ease;
                }
                
                .year-annotation {
                    background: linear-gradient(135deg, var(--darker-bg) 0%, var(--dark-bg) 100%);
                    border: 2px solid var(--primary-blue);
                    border-radius: 16px;
                    padding: 1.5rem;
                    max-width: 380px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }
                
                .year-annotation::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--primary-blue), var(--accent-orange));
                }
                
                .annotation-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border-glass);
                }
                
                .annotation-icon {
                    font-size: 2rem;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                
                .annotation-title-group h3 {
                    margin: 0;
                    color: white;
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1.2;
                }
                
                .annotation-title-group p {
                    margin: 0.25rem 0 0;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                
                .annotation-content {
                    color: var(--text-light);
                    line-height: 1.6;
                }
                
                .annotation-content p {
                    margin: 0 0 1rem;
                    font-size: 0.95rem;
                }
                
                .annotation-stats {
                    display: flex;
                    gap: 1rem;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 8px;
                    border: 1px solid var(--border-glass);
                }
                
                .stat-item {
                    text-align: center;
                    flex: 1;
                }
                
                .stat-number {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary-blue);
                    line-height: 1;
                }
                
                .stat-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                    line-height: 1.2;
                }
                
                .annotation-impact {
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    border-radius: 6px;
                    padding: 0.75rem;
                    font-size: 0.9rem;
                    font-style: italic;
                    color: #fca5a5;
                    margin: 1rem 0 0;
                }
                
                .annotation-sources {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-glass);
                }
                
                .annotation-sources h4 {
                    margin: 0 0 0.75rem;
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .source-link {
                    display: block;
                    color: var(--primary-blue);
                    text-decoration: none;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                    transition: color 0.2s ease;
                    line-height: 1.4;
                }
                
                .source-link:hover {
                    color: #60a5fa;
                    text-decoration: underline;
                }
                
                .annotation-close {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: var(--text-muted);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    pointer-events: auto;
                }
                
                .annotation-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                
                .year-annotation-trigger {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: var(--primary-blue);
                    border: 3px solid white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                    transition: all 0.2s ease;
                    z-index: 100;
                    animation: annotationPulse 2s infinite;
                }
                
                .year-annotation-trigger:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
                }
                
                @keyframes annotationPulse {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.7; 
                        transform: scale(1.1);
                    }
                }
                
                .annotation-trigger-2013 {
                    border-color: #f59e0b;
                    background: #f59e0b;
                }
                
                .annotation-trigger-2018 {
                    border-color: #dc2626;
                    background: #dc2626;
                }
            </style>
        `;
        
        d3.select('head').append('div').html(styles);
    }

    function showAnnotation(year, event) {
        const annotation = annotations[year];
        if (!annotation || !annotationContainer) return;

        // Hide any existing annotation
        hideAnnotation();

        // Create annotation content
        const content = annotationContainer
            .style('pointer-events', 'auto')
            .append('div')
            .attr('class', 'year-annotation');

        // Header
        const header = content.append('div').attr('class', 'annotation-header');
        header.append('div')
            .attr('class', 'annotation-icon')
            .text(annotation.icon);
        
        const titleGroup = header.append('div').attr('class', 'annotation-title-group');
        titleGroup.append('h3').text(annotation.title);
        titleGroup.append('p').text(annotation.subtitle);

        // Close button
        content.append('button')
            .attr('class', 'annotation-close')
            .html('×')
            .on('click', hideAnnotation);

        // Content
        content.append('div')
            .attr('class', 'annotation-content')
            .html(annotation.content);

        // Sources
        const sources = content.append('div').attr('class', 'annotation-sources');
        sources.append('h4').text('Sources');
        
        annotation.sources.forEach(source => {
            sources.append('a')
                .attr('class', 'source-link')
                .attr('href', source.url)
                .attr('target', '_blank')
                .attr('rel', 'noopener noreferrer')
                .text(source.title);
        });

        // Position the annotation
        const rect = event.target.getBoundingClientRect();
        const containerWidth = 380;
        const containerHeight = 500; // Approximate height
        
        let left = rect.left + rect.width + 20;
        let top = rect.top - containerHeight / 2;
        
        // Adjust if it would go off screen
        if (left + containerWidth > window.innerWidth) {
            left = rect.left - containerWidth - 20;
        }
        if (top < 20) {
            top = 20;
        }
        if (top + containerHeight > window.innerHeight - 20) {
            top = window.innerHeight - containerHeight - 20;
        }

        annotationContainer
            .style('left', left + 'px')
            .style('top', top + 'px')
            .style('opacity', '1');

        currentAnnotation = year;
    }

    function hideAnnotation() {
        if (annotationContainer) {
            annotationContainer
                .style('opacity', '0')
                .style('pointer-events', 'none');
            
            setTimeout(() => {
                annotationContainer.selectAll('*').remove();
            }, 300);
        }
        currentAnnotation = null;
    }

    function addTriggersToTimeline() {
        // Find the timeline slider container
        const sliderContainer = d3.select('#year-slider');
        if (!sliderContainer.node()) {
            console.warn("Timeline slider not found, retrying...");
            setTimeout(addTriggersToTimeline, 1000);
            return;
        }

        const slider = sliderContainer.select('input[type="range"]');
        const sliderRect = slider.node().getBoundingClientRect();
        const min = +slider.attr('min');
        const max = +slider.attr('max');

        // Calculate positions for 2013 and 2018
        const position2013 = ((2013 - min) / (max - min)) * sliderRect.width;
        const position2018 = ((2018 - min) / (max - min)) * sliderRect.width;

        // Add triggers
        [
            { year: 2013, position: position2013, class: 'annotation-trigger-2013' },
            { year: 2018, position: position2018, class: 'annotation-trigger-2018' }
        ].forEach(({ year, position, class: className }) => {
            sliderContainer
                .append('div')
                .attr('class', `year-annotation-trigger ${className}`)
                .style('position', 'absolute')
                .style('left', (position - 10) + 'px')
                .style('top', '-5px')
                .style('pointer-events', 'auto')
                .on('click', function(event) {
                    event.stopPropagation();
                    showAnnotation(year, event);
                })
                .append('title')
                .text(`Click to learn about ${annotations[year].title}`);
        });

        console.log("Annotation triggers added to timeline");
    }

    // Initialize when called
    init();

    return {
        show: showAnnotation,
        hide: hideAnnotation,
        addTriggers: addTriggersToTimeline,
        isVisible: () => currentAnnotation !== null
    };
}

// Initialize annotations after DOM is ready
window.yearAnnotations = null;

function initYearAnnotations() {
    if (typeof createYearAnnotations === 'function') {
        window.yearAnnotations = createYearAnnotations();
        // Add triggers after a short delay to ensure timeline is rendered
        setTimeout(() => {
            window.yearAnnotations.addTriggers();
        }, 1500);
    }
}

console.log("yearAnnotations.js loaded");