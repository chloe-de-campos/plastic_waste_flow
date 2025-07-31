// Country details functionality
class CountryDetails {
    constructor() {
        this.detailsPanel = null;
        this.createDetailsPanel();
    }

    createDetailsPanel() {
        // Create floating details panel
        this.detailsPanel = d3.select('body')
            .append('div')
            .attr('class', 'country-details-panel')
            .style('display', 'none');
    }

    showCountryDetails(countryData, mouseEvent) {
        if (!countryData) return;

        const details = this.processCountryData(countryData);
        
        this.detailsPanel
            .style('display', 'block')
            .style('left', (mouseEvent.pageX + 15) + 'px')
            .style('top', (mouseEvent.pageY - 10) + 'px')
            .html(`
                <div class="country-details-header">
                    <h4>${details.name}</h4>
                    <div class="country-status ${details.statusClass}">${details.status}</div>
                </div>
                <div class="country-details-stats">
                    <div class="detail-stat">
                        <span class="label">Total Exports:</span>
                        <span class="value">${details.exports}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="label">Total Imports:</span>
                        <span class="value">${details.imports}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="label">Net Balance:</span>
                        <span class="value ${details.balanceClass}">${details.balance}</span>
                    </div>
                    <div class="detail-stat">
                        <span class="label">Top Partner:</span>
                        <span class="value">${details.topPartner}</span>
                    </div>
                </div>
            `);
    }

    hideCountryDetails() {
        this.detailsPanel.style('display', 'none');
    }

    processCountryData(countryData) {
        // Process the country data to extract meaningful info
        // This will depend on your data structure
        const exports = this.formatNumber(countryData.totalExports || 0);
        const imports = this.formatNumber(countryData.totalImports || 0);
        const netBalance = (countryData.totalExports || 0) - (countryData.totalImports || 0);
        
        return {
            name: countryData.name || 'Unknown',
            exports: exports + ' tons',
            imports: imports + ' tons',
            balance: this.formatNumber(Math.abs(netBalance)) + ' tons',
            balanceClass: netBalance > 0 ? 'positive' : 'negative',
            status: netBalance > 0 ? 'Net Exporter' : 'Net Importer',
            statusClass: netBalance > 0 ? 'exporter' : 'importer',
            topPartner: countryData.topPartner || 'N/A'
        };
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(0);
    }
}