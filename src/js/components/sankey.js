function initSankey() {
    
    function updateSankey(yearData, containerId = 'sankey-chart', options = {}) {
        const container = d3.select(`#${containerId}`);
        container.html('');
        // Add a flexbox wrapper for vertical centering

        let flexWrapper = container.select('.sankey-container');


        if (!flexWrapper.node()) {
            flexWrapper = container.append('div')
                .attr('class', 'sankey-container')
                .style('height', '100%')
                .style('weidth', '100%');
        } else {
            flexWrapper.html('');
        }

        if (containerId.includes('modal')) {
              if (!flexWrapper.node()) {
                flexWrapper = container.append('div')
                    .style('display', 'flex')
                    .style('align-items', 'center')
                    .style('justify-content', 'center')
                    .style('height', '100%');
            } else {
                flexWrapper.html('');
            }
        }
        
        
        console.log(`📊 Updating Sankey in container: ${containerId} with ${yearData.length} flows`);

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

        const flowMap = {};
        const countryNames = {};
        
        validFlows.forEach(function(flow) {
            countryNames[flow.source_country] = flow.source_name || flow.source_country;
            countryNames[flow.target_country] = flow.target_name || flow.target_country;
            
            const key = flow.source_country + '=>' + flow.target_country;
            if (!flowMap[key]) flowMap[key] = 0;
            flowMap[key] += flow.weight_kg;
        });
        
        const netFlows = [];
        const processed = new Set();
        
        Object.keys(flowMap).forEach(function(key) {
            if (processed.has(key)) return;
            
            const [source, target] = key.split('=>');
            const reverseKey = target + '=>' + source;
            
            const forwardFlow = flowMap[key] || 0;
            const reverseFlow = flowMap[reverseKey] || 0;
            
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

        // DYNAMIC flow count based on container - MORE flows for modal
        const flowCount = containerId.includes('modal') ? 21 : 8; // Adjust to 20 for modal, 8 for default
        const topFlows = netFlows
            .sort((a, b) => b.value - a.value)
            .slice(0, flowCount);
        
        console.log(`📈 Showing top ${topFlows.length} flows in ${containerId}`);

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

        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width;
        // Adjust height: Significantly more for modal
        const height = containerId.includes('modal') ? 700 : 400; // Increased to 700px for modal
        
        // Adjust margins for labels and overall chart breathing room
        // Stretch lines more for modal by increasing left/right margins
        const margin = containerId.includes('modal')
            ? { top: 40, right: 260, bottom: 40, left: 260 } // Stretch more in modal
            : { top: 40, right: 180, bottom: 40, left: 180 };

        const svg = flexWrapper
            .append('svg')
            .attr('width', '100%')
            // .attr('height', 'auto')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', 'transparent')
            .style('max-width', '100%')
            .style('max-height', '100%');

        // Create unique gradient ID for each container to avoid conflicts
        const defs = svg.append('defs');
        const gradientId = `gradient-${containerId.replace(/-/g, '_')}`;
        const linkGradient = defs.append('linearGradient')
            .attr('id', gradientId)
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

        // Increase nodePadding for modal (larger font) or allow override via options
        const nodePadding = options.nodePadding || (containerId.includes('modal') ? 32 : 16);
        const sankey = d3.sankey()
            .nodeId(d => d.id)
            .nodeAlign(d3.sankeyLeft)
            .nodeWidth(20)
            .nodePadding(nodePadding)
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

            const weights = links.map(d => d.value);
            const minWeight = d3.min(weights);
            const maxWeight = d3.max(weights);
            
            const linkWidthScale = d3.scaleSqrt()
                .domain([minWeight, maxWeight])
                .range([8, 40]);

            svg.append("g")
                .selectAll("path")
                .data(sankeyData.links)
                .join("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", `url(#${gradientId})`)
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

            svg.append("g")
                .selectAll("rect")
                .data(sankeyData.nodes)
                .join("rect")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => Math.max(6, d.y1 - d.y0))
                .attr("width", d => d.x1 - d.x0)
                .attr("fill", d => d.type === 'exporter' ? '#3b82f6' : '#ef4444')
                .attr("rx", 0)
                .attr("stroke", "none")
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("opacity", 0.8);
                })
                .on("mouseout", function() {
                    d3.select(this).attr("opacity", 1);
                });

            // Labels pushed OUTSIDE the chart area with more breathing room
            // Use options.fontSize if provided, else default to 13px (dashboard) or 18px (modal)
            const labelFontSize = options.fontSize || (containerId.includes('modal') ? 18 : 13);
            // Dynamically adjust label offset based on font size
            const labelOffset = Math.round(labelFontSize * 2); // 1.6x font size for spacing
            svg.append("g")
                .selectAll("text")
                .data(sankeyData.nodes)
                .join("text")
                .attr("x", function(d) { 
                    return d.type === 'exporter' ? d.x0 - labelOffset : d.x1 + labelOffset;
                })
                .attr("y", d => (d.y1 + d.y0) / 2)
                // Scale dy with font size so gap increases with font size
                .attr("dy", (d) => (0.35 * labelFontSize / 13) + "em")
                .attr("text-anchor", d => d.type === 'exporter' ? "end" : "start")
                .text(d => d.name)
                .attr("font-family", "Inter, sans-serif")
                .attr("font-size", labelFontSize + "px")
                .attr("font-weight", "200")
                .attr("fill", "white")
                .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

            // Add "Exporters" and "Importers" labels
            const axisFontSize = options.fontSize ? Math.max(14, options.fontSize - 2) : (containerId.includes('modal') ? 18 : 12);
            svg.append("text")
                .attr("x", margin.left + 20) // Positioned to the left of exporter labels
                .attr("y", margin.top - 20) // Above the top node
                .attr("text-anchor", "end")
                .attr("font-family", "Inter, sans-serif")
                .attr("font-size", axisFontSize + "px")
                .attr("letter-spacing", "0.1rem")
                .attr("font-weight", "700")
                .attr("fill", "#3b82f6")
                .text("MAJOR EXPORTERS");

            svg.append("text")
                .attr("x", width - margin.right - 20 ) // Positioned to the right of importer labels
                .attr("y", margin.top - 20) // Above the top node
                .attr("text-anchor", "start")
                .attr("font-family", "Inter, sans-serif")
                .attr("font-size", axisFontSize + "px")
                .attr("letter-spacing", "0.1rem")
                .attr("font-weight", "700")
                .attr("fill", "#ef4444")
                .text("MAJOR IMPORTERS");


            console.log(`✅ Sankey created in ${containerId} with ${topFlows.length} flows`);
            
        } catch (error) {
            console.error("❌ Sankey error in", containerId, ":", error);
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

  
    function formatWeight(weight) {
        if (weight >= 1000000) return `${(weight / 1000000).toFixed(1)}M kg`;
        if (weight >= 1000) return `${(weight / 1000).toFixed(0)}K kg`;
        return `${weight.toFixed(0)} kg`;
    }

    return { updateSankey };
}
