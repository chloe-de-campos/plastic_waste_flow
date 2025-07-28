// Color mapping by region/continent
const regionColors = {
    "Asia": "#f59e42",
    "Europe": "#3b82f6",
    "North America": "#10b981",
    "South America": "#ef4444",
    "Africa": "#a21caf",
    "Oceania": "#fbbf24",
    "Other": "#64748b"
};

// Helper to get region for a country (should be replaced with a real lookup)
function getRegion(country) {
    // TODO: Replace with real region lookup
    if (["CHN", "JPN", "KOR", "HKG", "MYS", "VNM", "THA", "IDN", "PHL", "IND"].includes(country)) return "Asia";
    if (["USA", "CAN", "MEX"].includes(country)) return "North America";
    if (["DEU", "GBR", "FRA", "ITA", "ESP", "NLD", "BEL", "POL", "RUS"].includes(country)) return "Europe";
    if (["BRA", "ARG", "COL", "PER", "CHL"].includes(country)) return "South America";
    if (["ZAF", "EGY", "NGA", "KEN", "ETH"].includes(country)) return "Africa";
    if (["AUS", "NZL", "FJI"].includes(country)) return "Oceania";
    return "Other";
}

function renderTimelineChart(containerSelector, flowData, selectedRegions = null) {
    // Flatten data: { year: { flows: [...] } } => [{year, country, weight_kg, ...}]
    const flat = [];
    Object.entries(flowData).forEach(([year, flows]) => {
        flows.forEach(flow => {
            flat.push({
                year: +year,
                country: flow.source_country,
                name: flow.source_name || flow.source_country,
                weight_kg: flow.weight_kg || 0,
                region: getRegion(flow.source_country)
            });
        });
    });

    // Aggregate by country/year
    const countryYearMap = {};
    flat.forEach(d => {
        const key = d.country + "_" + d.year;
        if (!countryYearMap[key]) countryYearMap[key] = { country: d.country, name: d.name, year: d.year, region: d.region, weight_kg: 0 };
        countryYearMap[key].weight_kg += d.weight_kg;
    });
    const agg = Object.values(countryYearMap);

    // Get all countries and regions
    const countries = Array.from(new Set(agg.map(d => d.country)));
    const regions = Array.from(new Set(agg.map(d => d.region)));

    // Filter by selected regions if provided
    const filteredCountries = selectedRegions ? countries.filter(c => selectedRegions.includes(getRegion(c))) : countries;
    const filteredAgg = agg.filter(d => filteredCountries.includes(d.country));

    // Chart dimensions
    const margin = { top: 40, right: 120, bottom: 40, left: 60 };
    const width = 900;
    const height = 400;

    // Remove previous chart
    d3.select(containerSelector).selectAll("*").remove();
    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // X axis: years
    const years = Array.from(new Set(filteredAgg.map(d => d.year))).sort((a, b) => a - b);
    const x = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([margin.left, width - margin.right]);
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text("Year");

    // Y axis: weight
    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredAgg, d => d.weight_kg) * 1.1])
        .range([height - margin.bottom, margin.top]);
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d3.format(",.0f")(d)));
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", 18)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text("Plastic Waste Exported (kg)");

    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.weight_kg));

    // Draw lines for each country
    const countryAgg = d3.group(filteredAgg, d => d.country);
    countryAgg.forEach((values, country) => {
        const region = getRegion(country);
        svg.append("path")
            .datum(values.sort((a, b) => a.year - b.year))
            .attr("fill", "none")
            .attr("stroke", regionColors[region] || regionColors["Other"])
            .attr("stroke-width", 2.5)
            .attr("opacity", 0.85)
            .attr("d", line)
            .on("mouseover", function() {
                d3.select(this).attr("stroke-width", 4).attr("opacity", 1);
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2.5).attr("opacity", 0.85);
            });
    });

    // Legend for regions
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);
    regions.forEach((region, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 28)
            .attr("width", 22)
            .attr("height", 22)
            .attr("fill", regionColors[region] || regionColors["Other"]);
        legend.append("text")
            .attr("x", 30)
            .attr("y", i * 28 + 16)
            .attr("fill", "white")
            .attr("font-size", "13px")
            .text(region);
    });
    legend.append("text")
        .attr("x", 0)
        .attr("y", -12)
        .attr("fill", "white")
        .attr("font-size", "15px")
        .attr("font-weight", "bold")
        .text("Region");

    // Filter buttons
    const buttonGroup = d3.select(containerSelector)
        .append("div")
        .attr("class", "region-filter-buttons")
        .style("display", "flex")
        .style("gap", "10px")
        .style("margin", "10px 0 0 60px");
    regions.forEach(region => {
        buttonGroup.append("button")
            .text(region)
            .style("background", regionColors[region] || regionColors["Other"])
            .style("color", "white")
            .style("border", "none")
            .style("border-radius", "6px")
            .style("padding", "6px 16px")
            .style("font-size", "13px")
            .style("cursor", "pointer")
            .on("click", function() {
                // Toggle region filter
                const active = d3.select(this).classed("active");
                d3.selectAll(".region-filter-buttons button").classed("active", false);
                if (!active) {
                    d3.select(this).classed("active", true);
                    renderTimelineChart(containerSelector, flowData, [region]);
                } else {
                    renderTimelineChart(containerSelector, flowData, null);
                }
            });
    });
}

window.initTimelineChart = function() {
    // Default selector for timeline chart container
    const containerSelector = '#country-summary-chart';
    return {
        updateTimelineChart: function(flowData) {
            renderTimelineChart(containerSelector, flowData, null);
        }
    };
};
