function initSankey() {
 
    
 function updateSankey(yearData) {
        const container = d3.select('#sankey-chart');
        container.html('');

        // Filter for valid weight data
        const validFlows = yearData.filter(function(d) {
            return d.weight_kg && 
                d.weight_kg > 0 && 
                d.source_country && 
                d.target_country && 
                d.source_country !== d.target_country;
        });

        if (validFlows.length === 0) {
            container.append('div')
                .attr('class', 'no-data-message')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'center')
                .style('height', '300px')
                .style('color', 'rgba(255, 255, 255, 0.6)')
                .style('font-style', 'italic')
                .text('No weight data available');
            return;
        }

        // Aggregate flows by country pair - keeping China, Hong Kong separate
        const flowMap = {};
        const countryNames = {};
        
        
        validFlows.forEach(function(flow) {
            // Keep original country names - no combining
            countryNames[flow.source_country] = flow.source_name || flow.source_country;
            countryNames[flow.target_country] = flow.target_name || flow.target_country;
            
            const key = flow.source_country + '=>' + flow.target_country;
            if (!flowMap[key]) flowMap[key] = 0;
            flowMap[key] += flow.weight_kg;
        });
        

        // Add this right after loading validFlows:
console.log("Checking for China-Hong Kong flows...");

// Check all China/HK combinations in raw data
const chinaHKFlows = yearData.filter(d => {
    const source = d.source_country;
    const target = d.target_country;
    return (source === 'CHN' || source === 'HKG') && 
           (target === 'CHN' || target === 'HKG');
});

console.log("Raw China-HK flows found:", chinaHKFlows.length);
chinaHKFlows.forEach(flow => {
    console.log(`${flow.source_name} (${flow.source_country}) → ${flow.target_name} (${flow.target_country}): ${flow.weight_kg || flow.trade_value}kg`);
});

// Check if they have different country codes
const uniqueCountryCodes = [...new Set(yearData.map(d => d.source_country).concat(yearData.map(d => d.target_country)))];
console.log("All country codes in data:", uniqueCountryCodes.filter(code => code.includes('CHN') || code.includes('HKG')));
        // Calculate net flows to avoid double-showing bidirectional trade
        const netFlows = [];
        const processed = new Set();
        
        Object.keys(flowMap).forEach(function(key) {
            if (processed.has(key)) return;
            
            const [source, target] = key.split('=>');
            const reverseKey = target + '=>' + source;
            
            const forwardFlow = flowMap[key] || 0;
            const reverseFlow = flowMap[reverseKey] || 0;
            
            // Keep the larger flow direction
            if (forwardFlow >= reverseFlow && forwardFlow > 0) {
                netFlows.push({
                    source: source,
                    target: target,
                    value: forwardFlow
                });
            } else if (reverseFlow > forwardFlow) {
                netFlows.push({
                    source: target,
                    target: source,
                    value: reverseFlow
                });
            }
            
            processed.add(key);
            processed.add(reverseKey);
        });

        // Get top 12 flows for clean visualization
        const topFlows = netFlows
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
        
        console.log('Top flows by weight (China/HK separate):');
        topFlows.forEach((f, i) => 
            console.log(`${i+1}. ${countryNames[f.source]} → ${countryNames[f.target]}: ${formatWeight(f.value)}`)
        );

        // Create nodes
        const exporters = new Set();
        const importers = new Set();
        
        topFlows.forEach(function(flow) {
            exporters.add(flow.source);
            importers.add(flow.target);
        });
        
        const exporterNodes = Array.from(exporters).map(function(country) {
            return {
                id: 'exp_' + country,
                country: country,
                name: countryNames[country] || country,
                type: 'exporter'
            };
        });
        
        const importerNodes = Array.from(importers).map(function(country) {
            return {
                id: 'imp_' + country,
                country: country,
                name: countryNames[country] || country,
                type: 'importer'
            };
        });
        
        const allNodes = [...exporterNodes, ...importerNodes];
        
        const links = topFlows.map(function(flow) {
            return {
                source: 'exp_' + flow.source,
                target: 'imp_' + flow.target,
                value: flow.value
            };
        });

        // Set up SVG with more margin for external labels
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width;
        const height = 400;
        const margin = { top: 60, right: 150, bottom: 40, left: 150 };

        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', 'transparent');

        // Simple gradient from blue to orange
        const defs = svg.append('defs');
        const linkGradient = defs.append('linearGradient')
            .attr('id', 'simpleGradient')
            .attr('x1', '0')
            .attr('y1', '0')
            .attr('x2', width)
            .attr('y2', '0')
            .attr('gradientUnits', 'userSpaceOnUse');
        
        linkGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.8);
        
        linkGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f97316')
            .attr('stop-opacity', 0.8);

        // Create Sankey layout
        const sankey = d3.sankey()
            .nodeId(d => d.id)
            .nodeAlign(d3.sankeyLeft)
            .nodeWidth(20)
            .nodePadding(8)
            .extent([
                [margin.left, margin.top], 
                [width - margin.right, height - margin.bottom]
            ]);
        
        try {
            const graph = { nodes: allNodes, links: links };
            const sankeyData = sankey(graph);
            
            // Force nodes to left and right sides
            sankeyData.nodes.forEach(function(node) {
                if (node.type === 'exporter') {
                    node.x0 = margin.left;
                    node.x1 = margin.left + 20;
                } else {
                    node.x0 = width - margin.right - 20;
                    node.x1 = width - margin.right;
                }
            });

            // FIXED: Better link width scaling for more visible thickness
            const weights = links.map(d => d.value);
            const minWeight = d3.min(weights);
            const maxWeight = d3.max(weights);
            
            console.log(`Weight range: ${formatWeight(minWeight)} to ${formatWeight(maxWeight)}`);
            
            // More aggressive scaling to make differences more visible
            const linkWidthScale = d3.scaleSqrt() // Square root scale for better visual distinction
                .domain([minWeight, maxWeight])
                .range([8, 40]); // Much wider range: 8px minimum, 40px maximum

            svg.append("g")
                .selectAll("path")
                .data(sankeyData.links)
                .join("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", "url(#simpleGradient)")
                .attr("stroke-width", d => linkWidthScale(d.value))
                .attr("fill", "none")
                .attr("opacity", 0.7)
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("opacity", 1)
                        .attr("stroke-width", d => linkWidthScale(d.value) * 1.1);
                    createSimpleTooltip(event, d, svg);
                })
                .on("mousemove", function(event, d) {
                    moveSimpleTooltip(event, d, svg);
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("opacity", 0.77)
                        .attr("stroke-width", d => linkWidthScale(d.value));
                    svg.select(".simple-tooltip").remove();
                });

            // Draw nodes - clean rectangles with NO rounded corners
            svg.append("g")
                .selectAll("rect")
                .data(sankeyData.nodes)
                .join("rect")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => Math.max(6, d.y1 - d.y0))
                .attr("width", d => d.x1 - d.x0)
                .attr("fill", d => d.type === 'exporter' ? '#3b82f6' : '#ef4444')
                .attr("rx", 0) // NO rounded corners
                .attr("stroke", "none") // NO outlines
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("opacity", 0.8);
                })
                .on("mouseout", function() {
                    d3.select(this).attr("opacity", 1);
                });

            // Labels pushed OUTSIDE the chart area
            svg.append("g")
                .selectAll("text")
                .data(sankeyData.nodes)
                .join("text")
                .attr("x", function(d) { 
                    return d.type === 'exporter' ? d.x0 - 15 : d.x1 + 15; 
                })
                .attr("y", d => (d.y1 + d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.type === 'exporter' ? "end" : "start")
                .text(d => d.name)
                .attr("font-family", "Inter, sans-serif")
                .attr("font-size", "14px")
                .attr("font-weight", "500")
                .attr("fill", "white")
                .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

            console.log("✅ Simple weight-based Sankey created with thicker lines!");
            
        } catch (error) {
            console.error("❌ Sankey error:", error);
            svg.append('text')
                .attr('x', width/2)
                .attr('y', height/2)
                .attr('text-anchor', 'middle')
                .attr('font-family', 'Inter, sans-serif')
                .attr('fill', '#ef4444')
                .text('Error loading chart: ' + error.message);
        }
    }
    // Tooltip creation (only once per hover)
    function createSimpleTooltip(event, d, svg) {
        svg.select('.simple-tooltip').remove();
        const [x, y] = d3.pointer(event, svg.node());
        const tooltip = svg.append("g").attr("class", "simple-tooltip");
        // Set all text/rect positions relative to (0,0)
        tooltip.append("rect")
            .attr("fill", "rgba(15, 23, 42, 0.95)")
            .attr("stroke", "rgba(255, 255, 255, 0.2)")
            .attr("rx", 6)
            .attr("stroke-width", 1)
            .attr("opacity", 1);
        tooltip.append("text").attr("class", "tt-title")
            .attr("fill", "white")
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", "12px")
            .attr("font-weight", "500")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .text(`${d.source.name} → ${d.target.name}`);
        tooltip.append("text").attr("class", "tt-value")
            .attr("fill", "#3b82f6")
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", "14px")
            .attr("font-weight", "700")
            .attr("x", 0)
            .attr("y", -8)
            .attr("text-anchor", "middle")
            .text(formatWeight(d.value));
        tooltip.append("text").attr("class", "tt-note")
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", "11px")
            .attr("font-weight", "400")
            .attr("x", 0)
            .attr("y", 12)
            .attr("text-anchor", "middle")
            .text((d.source.name === "China, Hong Kong SAR" || d.target.name === "China, Hong Kong SAR") ? "Note: Hong Kong is a major importing hub for China" : "");
        // Calculate and cache bbox once
        const bbox = tooltip.node().getBBox();
        tooltip.select('rect')
            .attr("x", bbox.x - 8)
            .attr("y", bbox.y - 4)
            .attr("width", bbox.width + 16)
            .attr("height", bbox.height + 8);
        tooltip.node()._bboxOffset = { x: x - bbox.x, y: y - bbox.y };
        // Move group to mouse position
        tooltip.attr("transform", `translate(${x - bbox.x},${y - bbox.y})`);
    }
    function moveSimpleTooltip(event, d, svg) {
        const [x, y] = d3.pointer(event, svg.node());
        const tooltip = svg.select('.simple-tooltip');
        // Move the group only
        const bbox = tooltip.node().getBBox();
        tooltip.attr("transform", `translate(${x - bbox.x},${y - bbox.y})`);
    }

    // Helper function for weight formatting
    function formatWeight(weight) {
        if (weight >= 1000000) return `${(weight / 1000000).toFixed(1)}M kg`;
        if (weight >= 1000) return `${(weight / 1000).toFixed(0)}K kg`;
        return `${weight.toFixed(0)} kg`;
    }

    const returnValue = { updateSankey };
    console.log("📊 initCharts about to return:", returnValue);

    return returnValue;
}