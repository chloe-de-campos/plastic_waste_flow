// Modal functionality
class ChartModals {
    constructor() {
        this.modal = document.getElementById('chart-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalContainer = document.getElementById('modal-chart-container');
        this.closeBtn = document.querySelector('.modal-close');
        
        this.initializeEventListeners();
        this.makeChartsExpandable();
    }

    initializeEventListeners() {
        // Close modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    makeChartsExpandable() {
        // Add click handlers to chart panels
        const chartPanels = document.querySelectorAll('.chart-panel');
        chartPanels.forEach(panel => {
            if (!panel.className.includes('summary-panel')) {
                panel.classList.add('expandable');
                panel.style.position = 'relative';

                // Add expand hint text at the bottom of the panel (not modal)
                // const expandHint = document.createElement('div');
                // expandHint.className = 'expand-hint-text';
                // expandHint.textContent = 'Click to expand for details';
                // expandHint.style.textAlign = 'center';
                // expandHint.style.color = 'var(--text-muted)';
                // expandHint.style.fontSize = '0.95rem';
                // expandHint.style.padding = '0.5rem 0 0.2rem 0';
                // panel.appendChild(expandHint);

                // Allow panel click to expand
                panel.addEventListener('click', () => {
                    this.expandChart(panel);
                });
            }
        });
    }

    expandChart(chartPanel) {
    console.log("=== EXPAND CHART CALLED ===");
    console.log("Chart panel:", chartPanel);
    console.log("Panel classes:", chartPanel.classList);
    
    const title = chartPanel.querySelector('h3').textContent;
    console.log("Chart title:", title);
    
    let chartContent = chartPanel.querySelector('.chart-content');
    
    if (!chartContent) {
        console.log("No .chart-content found, looking for #map-container");
        chartContent = chartPanel.querySelector('#map-container');
    }
    
    if (!chartContent) {
        console.error('No chart content found in panel:', chartPanel);
        return;
    }
    
    console.log("Chart content found:", chartContent);
    
    this.modalTitle.textContent = title;
    
    // Clear modal and open it
    this.modalContainer.innerHTML = '';
    this.openModal();
    
    console.log("Modal opened, about to call reRenderChartInModal");
    
    // Re-render chart in modal if needed
    this.reRenderChartInModal(chartPanel.classList);
}

reRenderChartInModal(panelClasses) {
    console.log("=== RERENDER CHART IN MODAL ===");
    console.log("Panel classes array:", Array.from(panelClasses));
    
    const classArray = Array.from(panelClasses);
    const hasMapPanel = classArray.includes('map-panel');
    const hasFlowPanel = classArray.includes('flow-panel'); // Add this check
    
    console.log("Has map-panel:", hasMapPanel);
    console.log("Has flow-panel:", hasFlowPanel); // Add this log
    
    if (hasMapPanel) {
        console.log("🗺️ CALLING reRenderMap()");
        try {
            this.reRenderMap();
            console.log("✅ reRenderMap() completed successfully");
        } catch (error) {
            console.error("❌ Error in reRenderMap():", error);
        }
    } else if (hasFlowPanel) { // Add this condition
        console.log("📊 CALLING reRenderSankey()");
        try {
            this.reRenderSankey();
            console.log("✅ reRenderSankey() completed successfully");
        } catch (error) {
            console.error("❌ Error in reRenderSankey():", error);
        }
    } else {
        console.log("❌ No matching panel class found");
        console.log("Looking for 'map-panel' or 'flow-panel' in:", classArray);
    }
}

reRenderMap() {
    console.log("🗺️ Re-rendering map in modal");
    
    try {
   

        // Clear the modal container
        this.modalContainer.innerHTML = '';
        
        const mapContainer = document.createElement('div');
        mapContainer.id = 'modal-map-container';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        // mapContainer.style.background = 'rgba(15, 23, 42, 0.3)';
        mapContainer.style.borderRadius = '8px';
        
        this.modalContainer.appendChild(mapContainer);
        
        if (window.state && window.state.worldData) {
            const modalMapInstance = createWorldMap(window.state.worldData, 'modal-map-container');
            
            if (modalMapInstance) {
                // Get current year data directly from the state
                const currentYearData = window.state.data && window.state.currentYear ? 
                    window.state.data[window.state.currentYear] || [] : [];
                
                console.log(`📊 Using ${currentYearData.length} flows for modal map`);
                
                // Calculate and apply country colors
                const netTradeValues = {};
                currentYearData.forEach(flow => {
                    netTradeValues[flow.source_country] = (netTradeValues[flow.source_country] || 0) + (flow.trade_value || 0);
                    netTradeValues[flow.target_country] = (netTradeValues[flow.target_country] || 0) - (flow.trade_value || 0);
                });
                modalMapInstance.updateCountryColors(netTradeValues);
                
                // Add flow arrows - just show top flows for the modal
                if (currentYearData.length > 0) {
                    const topFlows = currentYearData
                        .filter(flow => flow.weight_kg > 0) // Only positive flows
                        .sort((a, b) => (b.weight_kg || 0) - (a.weight_kg || 0))

                    
                    console.log(`🏹 Adding ${topFlows.length} flow arrows to modal`);
                    
                    

                    setTimeout(() => {
                        const modalFlowArrows = createFlowArrows('modal-map-container', topFlows, modalMapInstance.projection);
                        window.state.modalFlowArrows = modalFlowArrows;
                    }, 100); // Small delay to ensure SVG is ready
                }
                
                window.state.modalMapInstance = modalMapInstance;
                console.log("✅ Modal map created successfully");
            }
        }
    } catch (error) {
        console.error("❌ Error in reRenderMap():", error);
        this.modalContainer.innerHTML = `
            <div style="color: red; text-align: center; padding: 50px;">
                <div>❌ Error creating modal map</div>
                <div style="font-size: 12px; margin-top: 10px;">${error.message}</div>
            </div>
        `;
    }
}



addModalMapFeatures(mapInstance, controlPanel) {
    // Add click handlers for the new controls
    controlPanel.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-map-control')) {
            const action = e.target.dataset.action;
            
            switch(action) {
                case 'show-flows':
                    console.log('Show all flows clicked');
                    // Show more flow arrows
                    break;
                case 'country-details':
                    console.log('Country details mode');
                    // Enable enhanced country clicking
                    break;
                case 'zoom-regions':
                    console.log('Regional view');
                    // Add region focusing
                    break;
            }
        }
    });
}
// Update your modals.js openMapModal function:
openMapModal() {
    console.log("🗺️ Opening map modal");
    
    const modal = d3.select('#chart-modal');
    
    // Set modal title
    d3.select('#modal-title').text('Interactive World Map - Plastic Waste Trade');
    
    // Clear and prepare modal body
    const modalBody = d3.select('#modal-chart-container');
    modalBody.selectAll('*').remove();
    
    // Add controls and instructions (same as before)
    const controlsDiv = modalBody.append('div')
        .style('margin-bottom', '1rem')
        .style('text-align', 'center');
    
    controlsDiv.append('button')
        .attr('class', 'modal-map-control')
        .text('Reset Zoom')
        .on('click', () => {
            if (window.state.modalMapInstance) {
                window.state.modalMapInstance.svg.transition()
                    .duration(750)
                    .call(window.state.modalMapInstance.zoom.transform, d3.zoomIdentity);
            }
        });

    modalBody.append('div')
        .attr('class', 'modal-instruction')
        .html('<span class="instruction-icon">🖱️</span>Click on countries to see detailed trade information');
    
    // Create modal map container
    const modalMapContainer = modalBody.append('div')
        .attr('id', 'modal-map-container')
        .style('width', '100%')
        .style('height', '70vh')
        .style('margin-top', '1rem');
    
    // Show modal first
    modal.style('display', 'block');
    document.body.style.overflow = 'hidden';
    
    // Use requestAnimationFrame to ensure modal is fully rendered
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (window.state.worldData) {
                console.log("🌍 Creating modal map...");
                window.state.modalMapInstance = createWorldMap(window.state.worldData, 'modal-map-container');
                
                // Wait for map to render, then attach labels
                const attachLabels = () => {
                    console.log("🏷️ Attempting to attach country labels...");
                    if (window.state.countryLabels && window.state.modalMapInstance) {
                        window.state.countryLabels.reset();
                        window.state.countryLabels.attachToModalMap(
                            window.state.modalMapInstance, 
                            '#modal-chart-container'
                        );
                    }
                };
                
                // Try multiple times with different delays
                setTimeout(attachLabels, 100);
                setTimeout(attachLabels, 500);
                setTimeout(attachLabels, 1000);
                
                // Update colors after labels are attached
                setTimeout(() => {
                    if (window.state.currentFlows && window.state.modalMapInstance.updateCountryColors) {
                        const netTradeValues = {};
                        window.state.currentFlows.forEach(flow => {
                            if (!netTradeValues[flow.source_country]) {
                                netTradeValues[flow.source_country] = 0;
                            }
                            netTradeValues[flow.source_country] += flow.trade_value;
                            
                            if (!netTradeValues[flow.target_country]) {
                                netTradeValues[flow.target_country] = 0;
                            }
                            netTradeValues[flow.target_country] -= flow.trade_value;
                        });
                        
                        window.state.modalMapInstance.updateCountryColors(netTradeValues);
                        
                        // Re-attach labels after color update
                        setTimeout(attachLabels, 200);
                    }
                    
                    // Create flow arrows
                    window.state.modalFlowArrows = createFlowArrows(
                        'modal-map-container', 
                        window.state.currentFlows, 
                        window.state.modalMapInstance.projection
                    );
                }, 1200);
            }
        });
    });
}

reRenderSankey() {
    console.log("📊 Re-rendering Sankey in modal");
    
    // Clear the modal container
    this.modalContainer.innerHTML = '';
    
    // Create a bigger container
    const sankeyContainer = document.createElement('div');
    sankeyContainer.id = 'modal-sankey-container';
    sankeyContainer.style.width = '100%';
    sankeyContainer.style.height = '600px';
    sankeyContainer.style.minHeight = '500px';
    
    this.modalContainer.appendChild(sankeyContainer);
    
    // Get current data and render the Sankey
    if (window.state && window.state.data && window.state.currentYear && window.state.charts) {
        const currentYearData = window.state.data[window.state.currentYear] || [];
        
        console.log(`📈 Rendering modal Sankey with ${currentYearData.length} flows`);
        
        // Call updateSankey with the modal container ID
        window.state.charts.updateSankey(currentYearData, 'modal-sankey-container');
        
        console.log("✅ Modal Sankey rendering completed");
    } else {
        sankeyContainer.innerHTML = `
            <div style="color: red; text-align: center; padding: 50px; font-size: 16px;">
                <div>❌ Cannot render Sankey</div>
                <div style="font-size: 12px; margin-top: 10px;">Missing data or charts instance</div>
            </div>
        `;
    }
}

    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(){
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
       
        
        // Clean up country labels
        if (window.state.countryLabels) {
            window.state.countryLabels.reset();
            window.state.countryLabels.hide();
        }
        
        // Clean up modal map instance
        window.state.modalMapInstance = null;
        window.state.modalFlowArrows = null;

    }
}

