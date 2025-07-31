// src/js/components/countryLabels.js
console.log("countryLabels.js loading...");

function createCountryLabels() {
    let activeLabel = null;
    let labelContainer = null;
    let attachedToModal = false;
    let attachmentInterval = null;
    let attachmentAttempts = 0;
    const maxAttempts = 10;

    // Country name mapping (same as before)
    const countryNames = {
        "USA": "United States",
        "CHN": "China", 
        "DEU": "Germany",
        "JPN": "Japan",
        "MYS": "Malaysia",
        "THA": "Thailand", 
        "VNM": "Vietnam",
        "IDN": "Indonesia",
        "GBR": "United Kingdom",
        "FRA": "France",
        "NLD": "Netherlands",
        "BEL": "Belgium",
        "CAN": "Canada",
        "ITA": "Italy",
        "AUS": "Australia",
        "MEX": "Mexico",
        "ESP": "Spain",
        "KOR": "South Korea",
        "IND": "India",
        "TUR": "Turkey",
        "HKG": "Hong Kong",
        "TWN": "Taiwan",
        "PHL": "Philippines",
        "PAK": "Pakistan",
        "POL": "Poland",
        "BRA": "Brazil",
        "ARG": "Argentina",
        "ZAF": "South Africa",
        "RUS": "Russia",
        "SGP": "Singapore",
        "NZL": "New Zealand",
        "CHL": "Chile",
        "ARE": "United Arab Emirates",
        "SAU": "Saudi Arabia",
        "ISR": "Israel",
        "EGY": "Egypt",
        "NGA": "Nigeria",
        "KEN": "Kenya",
        "GHA": "Ghana",
        "MAR": "Morocco",
        "TUN": "Tunisia"
    };

    function init() {
        console.log("🏷️ Initializing country labels (modal-only)...");
        
        // Add styles
        addLabelStyles();
        
        // Create label container
        labelContainer = d3.select('body')
            .append('div')
            .attr('class', 'country-label-container')
            .style('position', 'fixed')
            .style('z-index', '2100') // Higher than modal (2000)
            .style('pointer-events', 'none')
            .style('opacity', '0');

        console.log("✅ Country labels initialized");
    }

    function addLabelStyles() {
        if (d3.select('#country-label-styles').node()) return;

        const styles = `
            <style id="country-label-styles">
                .country-label-container {
                    transition: all 0.25s ease;
                }
                
                .country-label {
                    background: linear-gradient(135deg, var(--darker-bg) 0%, var(--dark-bg) 100%);
                    border: 2px solid var(--primary-blue);
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    max-width: 280px;
                    min-width: 240px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(12px);
                    position: relative;
                    overflow: hidden;
                }
                
                .country-label::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--primary-blue), var(--accent-orange));
                }
                
                .country-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border-glass);
                }
                
                .country-flag {
                    font-size: 1.5rem;
                    width: 32px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    border: 1px solid var(--border-glass);
                }
                
                .country-name-group h3 {
                    margin: 0;
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 700;
                    line-height: 1.2;
                }
                
                .country-name-group .country-code {
                    margin: 0.25rem 0 0;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: 500;
                    font-family: 'Monaco', 'Consolas', monospace;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                    display: inline-block;
                }
                
                .country-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                
                .country-stat {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.3rem 0;
                }
                
                .stat-label {
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                
                .stat-value {
                    color: white;
                    font-weight: 600;
                    font-size: 0.85rem;
                    text-align: right;
                }
                
                .stat-value.positive {
                    color: var(--primary-blue);
                }
                
                .stat-value.negative {
                    color: var(--accent-orange);
                }
                
                .stat-value.neutral {
                    color: var(--text-muted);
                }
                
                .country-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 16px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .country-status.major-exporter {
                    background: rgba(59, 130, 246, 0.15);
                    color: var(--primary-blue);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
                
                .country-status.major-importer {
                    background: rgba(239, 68, 68, 0.15);
                    color: var(--accent-orange);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                
                .country-status.balanced {
                    background: rgba(148, 163, 184, 0.15);
                    color: var(--text-muted);
                    border: 1px solid rgba(148, 163, 184, 0.3);
                }
                
                .country-status.no-data {
                    background: rgba(55, 65, 81, 0.3);
                    color: var(--text-muted);
                    border: 1px solid rgba(75, 85, 99, 0.5);
                }
                
                .status-indicator {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: currentColor;
                }
                
                .country-close {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: var(--text-muted);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    pointer-events: auto;
                }
                
                .country-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                
                .country-note {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border-glass);
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-style: italic;
                    line-height: 1.4;
                }

                .modal-instruction {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    padding: 0.75rem;
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--primary-blue);
                    text-align: center;
                    line-height: 1.4;
                }

                .modal-instruction .instruction-icon {
                    margin-right: 0.4rem;
                    font-size: 0.8rem;
                }
            </style>
        `;
        
        d3.select('head').append('div').html(styles);
        console.log("📝 Country label styles added");
    }

    // All the same functions as before (showLabel, calculateCountryStats, etc.)
function showLabel(countryData, event) {
    console.log("🏷️ Showing label for country:", countryData);
    
    if (!labelContainer) {
        console.error("❌ Label container not initialized");
        return;
    }

    // Hide any existing label
    hideLabel();

    // Get current year's data for this country
    const currentYear = window.state?.currentYear || 2002;
    const yearData = window.state?.data?.[currentYear] || [];
    
    console.log("📊 Year data length:", yearData.length, "Current year:", currentYear);
    
    // Calculate country's trade statistics
    const countryStats = calculateCountryStats(countryData.alpha3, yearData);
    console.log("📈 Country stats:", countryStats);
    
    // Create label content
    const label = labelContainer
        .style('pointer-events', 'auto')
        .append('div')
        .attr('class', 'country-label')
        .on('click', function(event) {
            event.stopPropagation();
        });

    console.log("📦 Label element created:", label.node());

    // Header with country info
    const header = label.append('div').attr('class', 'country-header');
    
    header.append('div')
        .attr('class', 'country-flag')
        .text(getCountryFlag(countryData.alpha3));
    
    const nameGroup = header.append('div').attr('class', 'country-name-group');
    nameGroup.append('h3').text(countryData.name);
    nameGroup.append('div')
        .attr('class', 'country-code')
        .text(countryData.alpha3);

    console.log("🏗️ Header created with name:", countryData.name);

    // Close button
    label.append('button')
        .attr('class', 'country-close')
        .html('×')
        .on('click', function(event) {
            event.stopPropagation();
            hideLabel();
        });

    // Statistics
    const statsContainer = label.append('div').attr('class', 'country-stats');
    
    // Year indicator
    statsContainer.append('div')
        .attr('class', 'country-stat')
        .style('border-bottom', '1px solid var(--border-glass)')
        .style('margin-bottom', '0.5rem')
        .style('padding-bottom', '0.5rem')
        .call(div => {
            div.append('span')
                .attr('class', 'stat-label')
                .text('Year');
            div.append('span')
                .attr('class', 'stat-value')
                .style('color', 'var(--primary-blue)')
                .style('font-weight', '700')
                .text(currentYear);
        });

    console.log("📅 Year indicator added:", currentYear);

    // Trade statistics
    if (countryStats.hasData) {
        console.log("📊 Adding trade statistics...");
        
        // Status badge
        const statusDiv = statsContainer.append('div')
            .attr('class', 'country-stat')
            .style('margin-bottom', '0.5rem');
        
        statusDiv.append('span')
            .attr('class', 'stat-label')
            .text('Status');
            
        const statusBadge = statusDiv.append('div')
            .attr('class', `country-status ${countryStats.status}`);
        
        statusBadge.append('div')
            .attr('class', 'status-indicator');
        
        statusBadge.append('span')
            .text(countryStats.statusLabel);

        // Export value
        statsContainer.append('div')
            .attr('class', 'country-stat')
            .call(div => {
                div.append('span')
                    .attr('class', 'stat-label')
                    .text('Exports');
                div.append('span')
                    .attr('class', `stat-value ${countryStats.exports > 0 ? 'positive' : 'neutral'}`)
                    .text(formatWeight(countryStats.exports));
            });

        // Import value
        statsContainer.append('div')
            .attr('class', 'country-stat')
            .call(div => {
                div.append('span')
                    .attr('class', 'stat-label')
                    .text('Imports');
                div.append('span')
                    .attr('class', `stat-value ${countryStats.imports > 0 ? 'negative' : 'neutral'}`)
                    .text(formatWeight(countryStats.imports));
            });

        // Net trade
        statsContainer.append('div')
            .attr('class', 'country-stat')
            .call(div => {
                div.append('span')
                    .attr('class', 'stat-label')
                    .text('Net Trade');
                div.append('span')
                    .attr('class', `stat-value ${countryStats.netTrade > 0 ? 'positive' : countryStats.netTrade < 0 ? 'negative' : 'neutral'}`)
                    .text(formatWeight(countryStats.netTrade, true));
            });

        // Number of partners
        statsContainer.append('div')
            .attr('class', 'country-stat')
            .call(div => {
                div.append('span')
                    .attr('class', 'stat-label')
                    .text('Partners');
                div.append('span')
                    .attr('class', 'stat-value')
                    .text(countryStats.partners);
            });

            

    } else {
        console.log("📭 No data available, showing no-data message");
        
        // No data available
        const statusDiv = statsContainer.append('div')
            .attr('class', 'country-stat');
        
        statusDiv.append('span')
            .attr('class', 'stat-label')
            .text('Status');
            
        const statusBadge = statusDiv.append('div')
            .attr('class', 'country-status no-data');
        
        statusBadge.append('div')
            .attr('class', 'status-indicator');
        
        statusBadge.append('span')
            .text('No Data');

        label.append('div')
            .attr('class', 'country-note')
            .text(`No plastic waste trade data available for ${countryData.name} in ${currentYear}.`);
    }

    console.log("📋 Content added, positioning label...");

    // Position the label AFTER content is added so we get correct dimensions
    setTimeout(() => {
        positionLabel(label, event);
        
        // Show with animation
        labelContainer
            .style('opacity', '1')
            .style('transform', 'none'); // Clear any transforms

        activeLabel = countryData.alpha3;
        console.log("✅ Country label displayed and positioned");
    }, 50); // Small delay to ensure content is rendered

    // Don't auto-hide - let user close manually
    console.log("🏷️ Label setup complete");
}

    // [Include all the helper functions from before: calculateCountryStats, getWeight, formatWeight, getCountryFlag, positionLabel, hideLabel]
    
    function calculateCountryStats(alpha3, yearData) {
        let exports = 0;
        let imports = 0;
        const partners = new Set();

        yearData.forEach(flow => {
            const weight = getWeight(flow);
            
            if (flow.source_country === alpha3) {
                exports += weight;
                partners.add(flow.target_country);
            }
            if (flow.target_country === alpha3) {
                imports += weight;
                partners.add(flow.source_country);
            }
        });

        const netTrade = exports - imports;
        const hasData = exports > 0 || imports > 0;
        
        let status, statusLabel;
        if (!hasData) {
            status = 'no-data';
            statusLabel = 'No Data';
        } else if (Math.abs(netTrade) < Math.max(exports, imports) * 0.1) {
            status = 'balanced';
            statusLabel = 'Balanced';
        } else if (netTrade > 0) {
            status = 'major-exporter';
            statusLabel = 'Net Exporter';
        } else {
            status = 'major-importer';
            statusLabel = 'Net Importer';
        }

        return {
            exports,
            imports,
            netTrade,
            partners: partners.size,
            hasData,
            status,
            statusLabel
        };
    }

    function getWeight(flow) {
        return flow.weight_kg || flow.qty || flow.trade_value || 0;
    }

    function formatWeight(weight, showSign = false) {
        if (weight === 0) return '0 kg';
        
        const absWeight = Math.abs(weight);
        const sign = showSign ? (weight >= 0 ? '+' : '-') : '';
        
        if (absWeight >= 1000000) {
            return `${sign}${(absWeight / 1000000).toFixed(1)}M kg`;
        } else if (absWeight >= 1000) {
            return `${sign}${(absWeight / 1000).toFixed(1)}K kg`;
        } else {
            return `${sign}${absWeight.toFixed(0)} kg`;
        }
    }

    function getCountryFlag(alpha3) {
        const flags = {
            'USA': '🇺🇸', 'CHN': '🇨🇳', 'DEU': '🇩🇪', 'JPN': '🇯🇵',
            'MYS': '🇲🇾', 'THA': '🇹🇭', 'VNM': '🇻🇳', 'IDN': '🇮🇩',
            'GBR': '🇬🇧', 'FRA': '🇫🇷', 'NLD': '🇳🇱', 'BEL': '🇧🇪',
            'CAN': '🇨🇦', 'ITA': '🇮🇹', 'AUS': '🇦🇺', 'MEX': '🇲🇽',
            'ESP': '🇪🇸', 'KOR': '🇰🇷', 'IND': '🇮🇳', 'TUR': '🇹🇷',
            'HKG': '🇭🇰', 'TWN': '🇹🇼', 'PHL': '🇵🇭', 'PAK': '🇵🇰',
            'POL': '🇵🇱', 'BRA': '🇧🇷', 'ARG': '🇦🇷', 'ZAF': '🇿🇦',
            'RUS': '🇷🇺', 'SGP': '🇸🇬', 'NZL': '🇳🇿', 'CHL': '🇨🇱'
        };
        return flags[alpha3] || '🌍';
    }

function positionLabel(label, event) {
    // Get the modal container bounds instead of using window coordinates
    const modalContainer = document.querySelector('#modal-chart-container');
    const modalRect = modalContainer ? modalContainer.getBoundingClientRect() : null;
    
    if (!modalRect) {
        console.warn("⚠️ Modal container not found, using fallback positioning");
        // Fallback to center of screen
        labelContainer
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%, -50%)');
        return;
    }
    
    // Get click position relative to the modal
    const clickRect = event.target.getBoundingClientRect();
    const labelNode = label.node();
    const labelRect = labelNode.getBoundingClientRect();
    
    // Calculate position within modal bounds
    let left = clickRect.left + clickRect.width + 15;
    let top = clickRect.top + clickRect.height / 2 - labelRect.height / 2;
    
    // Keep within modal bounds (not window bounds)
    const modalBounds = {
        left: modalRect.left + 20,
        right: modalRect.right - 20,
        top: modalRect.top + 60, // Account for modal header
        bottom: modalRect.bottom - 20
    };
    
    // Adjust horizontally
    if (left + labelRect.width > modalBounds.right) {
        left = clickRect.left - labelRect.width - 15;
    }
    if (left < modalBounds.left) {
        left = modalBounds.left;
    }
    
    // Adjust vertically  
    if (top < modalBounds.top) {
        top = modalBounds.top;
    }
    if (top + labelRect.height > modalBounds.bottom) {
        top = modalBounds.bottom - labelRect.height;
    }
    
    // Ensure it doesn't go off screen entirely
    left = Math.max(10, Math.min(left, window.innerWidth - labelRect.width - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - labelRect.height - 10));

    labelContainer
        .style('left', left + 'px')
        .style('top', top + 'px')
        .style('transform', 'none'); // Clear any transform
    
    console.log("📍 Label positioned at:", { left, top, modalBounds });
}

function hideLabel() {
    console.log("🫥 Hiding label, activeLabel was:", activeLabel);
    
    if (labelContainer) {
        labelContainer
            .style('opacity', '0')
            .style('pointer-events', 'none');
        
        setTimeout(() => {
            labelContainer.selectAll('*').remove();
            console.log("🗑️ Label content cleared");
        }, 300);
    }
    activeLabel = null;
}



   // Update the attachToModalMap function in countryLabels.js:
 function ensurePersistentAttachment(mapInstance, modalContainer) {
        console.log("🔄 Setting up persistent attachment monitoring...");
        
        // Clear any existing interval
        if (attachmentInterval) {
            clearInterval(attachmentInterval);
        }
        
        attachmentAttempts = 0;
        
        // Check and reattach every second until it's working
        attachmentInterval = setInterval(() => {
            attachmentAttempts++;
            console.log(`🔍 Checking attachment status (attempt ${attachmentAttempts})...`);
            
            if (attachmentAttempts > maxAttempts) {
                console.log("⏹️ Max attempts reached, stopping monitoring");
                clearInterval(attachmentInterval);
                return;
            }
            
            // Check if countries exist and have our handlers
            const countries = mapInstance.svg.selectAll('path.country');
            if (countries.size() === 0) {
                console.log("⚠️ No countries found, retrying...");
                return;
            }
            
            // Check if our click handlers are still there
            const firstCountry = countries.node();
            const hasOurHandler = firstCountry && firstCountry.__on && 
                                  firstCountry.__on.some(handler => handler.type === 'click' && handler.name === 'countryLabel');
            
            if (!hasOurHandler) {
                console.log("🔧 Click handlers missing, reattaching...");
                attachedToModal = false; // Reset flag
                attachToModalMap(mapInstance, modalContainer);
            } else {
                console.log("✅ Click handlers confirmed, stopping monitoring");
                clearInterval(attachmentInterval);
            }
        }, 1000);
    }

    // Initialize
    init();

    return {
    show: showLabel,
    hide: hideLabel,
    // attachToModalMap: attachToModalMap,
    isVisible: () => activeLabel !== null,
    reset: () => { attachedToModal = false; 

        if (attachmentInterval) {
                clearInterval(attachmentInterval);
                attachmentInterval = null;
            }
    },
    
    // Debug functions
    testLabel: function() {
        console.log("🧪 Testing country label...");
        const mockCountryData = {
            alpha3: 'USA',
            name: 'United States',
            numericId: '840'
        };
        const mockEvent = {
            target: {
                getBoundingClientRect: () => ({
                    left: window.innerWidth / 2,
                    top: window.innerHeight / 2,
                    width: 20,
                    height: 20
                })
            }
        };
        showLabel(mockCountryData, mockEvent);
    },
    
    // Test click handlers
    testClickHandlers: function() {
        console.log("🧪 Testing click handlers...");
        const modalMap = d3.select('#modal-map-container svg');
        if (!modalMap.node()) {
            console.log("❌ No modal map found");
            return;
        }
        
        const countries = modalMap.selectAll('path.country');
        console.log("Countries found:", countries.size());
        
        if (countries.size() > 0) {
            const firstCountry = countries.node();
            console.log("First country:", firstCountry);
            console.log("Click handlers:", firstCountry.__on);
            
            // Try to trigger a click
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100
            });
            
            console.log("🖱️ Triggering manual click...");
            firstCountry.dispatchEvent(clickEvent);
        }
    },
    
    // Force attach (for debugging)
    forceAttach: function() {
        console.log("🔧 Force attaching to modal map...");
        attachedToModal = false; // Reset flag
        if (window.state.modalMapInstance) {
            this.attachToModalMap(window.state.modalMapInstance, '#modal-chart-container');
        }
    }
};
}

console.log("countryLabels.js loaded");