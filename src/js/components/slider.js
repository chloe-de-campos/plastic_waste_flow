
// In your slider.js
function initYearSlider(years, onYearChange) {
    console.log("Initializing year slider...");
    const container = d3.select('#year-slider'); // This is the div
    const yearDisplay = d3.select('#year-display'); // This is the span
    const playButton = d3.select('#play-button');
    
    let animationInterval = null;
    let isPlaying = false;
    
    container.html(''); // Clear existing content
    
    const sliderInput = container.append('input')
        .attr('type', 'range')
        .attr('min', d3.min(years))
        .attr('max', d3.max(years))
        .attr('value', d3.min(years))
        .attr('step', 1)
        .on('input', function() {
            stopAnimation();
            updateYear(+this.value);
        });

    function updateYear(year) {
        sliderInput.property('value', year);
        yearDisplay.text(year); // Update the dedicated span
        onYearChange(year);
    }

    function toggleAnimation() {
        if (isPlaying) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }

        // Add this function to populate year labels dynamically
    // function initializeTimelineLabels() {
    //     const yearLabelsTrack = document.querySelector('.year-labels-track');
    //     const startYear = 2000;
    //     const endYear = 2022;
    //     const yearsToShow = [2000, 2005, 2010, 2015, 2020, 2022];
        
    //     // Clear existing labels
    //     yearLabelsTrack.innerHTML = '';
        
    //     yearsToShow.forEach(year => {
    //         const label = document.createElement('span');
    //         label.textContent = year;
    //         // Calculate percentage position for precise placement
    //         const percentage = ((year - startYear) / (endYear - startYear)) * 100;
    //         label.style.left = `${percentage}%`;
    //         label.style.position = 'absolute'; // Position absolutely within the track
    //         label.style.transform = 'translateX(-50%)'; // Center the text on its point
    //         yearLabelsTrack.appendChild(label);
    //     });
    // }

    function initializeTimelineLabels() {
        const yearLabelsTrack = document.querySelector('.year-labels-track');
        if (!yearLabelsTrack) return;
        
        const startYear = 2002;
        const endYear = 2022;
        const yearsToShow = [2002, 2005, 2008, 2011, 2014, 2017, 2020, 2022];
        
        // Clear existing labels
        yearLabelsTrack.innerHTML = '';
        
        yearsToShow.forEach(year => {
            const label = document.createElement('span');
            label.textContent = year;
            // Calculate percentage position
            const percentage = ((year - startYear) / (endYear - startYear)) * 100;
            label.style.left = `${percentage}%`;
            label.style.position = 'absolute';
            label.style.transform = 'translateX(-50%)';
            yearLabelsTrack.appendChild(label);
        });
    }

    // Call this when your page loads
    document.addEventListener('DOMContentLoaded', () => {
        initializeTimelineLabels();
    });

    
    function startAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        playButton.html('<i class="fas fa-pause"></i>');
        
        let currentIndex = years.indexOf(+sliderInput.property('value'));
        if (currentIndex >= years.length - 1) {
            currentIndex = -1; // Will be incremented to 0
        }
        
        animationInterval = setInterval(() => {
            currentIndex++;
            if (currentIndex >= years.length) {
                stopAnimation();
                return;
            }
            updateYear(years[currentIndex]);
        }, 1500);
    }
    
    function stopAnimation() {
        if (!isPlaying) return;
        clearInterval(animationInterval);
        isPlaying = false;
        playButton.html('<i class="fas fa-play"></i>');
    }


    // Call this when initializing your timeline
    // initializeTimelineLabels();

    playButton.on('click', toggleAnimation);
    updateYear(d3.min(years)); // Set initial year
    
    console.log("Year slider initialized successfully");
    
    return { setValue: updateYear, startAnimation, stopAnimation };
}