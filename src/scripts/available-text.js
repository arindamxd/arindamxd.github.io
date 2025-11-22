// Available text responsive handler
(function () {
    function updateAvailableText() {
        const container = document.querySelector('.available-text-container');
        if (!container) return;

        const isMobile = window.innerWidth <= 610;

        if (isMobile) {
            container.innerHTML = `
                <p class="proton-text proton-styles-preset-small-text">Available for <span class="proton-text" style="--proton-text-color: rgba(23, 23, 23, 0.6)">opportunities</span></p>
            `;
        } else {
            container.innerHTML = `
                <p class="proton-text proton-styles-preset-small-text">Available for</p>
                <p class="proton-text proton-styles-preset-small-text" style="--proton-text-color: rgba(23, 23, 23, 0.6)">opportunities</p>
            `;
        }
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAvailableText);
    } else {
        updateAvailableText();
    }

    // Listen for resize events
    window.addEventListener('resize', updateAvailableText);
})();
