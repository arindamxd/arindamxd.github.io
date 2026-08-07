// Available text responsive handler
(function () {
    const smallText =
        'm-0 p-0 font-manrope text-[13px] font-semibold leading-[120%] tracking-[-0.05em] text-text max-framer:text-[12px]';
    const muted = 'text-text/60';

    function updateAvailableText() {
        const container = document.querySelector('.available-text-container');
        if (!container) return;

        const isMobile = window.innerWidth <= 610;

        if (isMobile) {
            container.innerHTML = `
                <p class="${smallText}">Available for <span class="${muted}">opportunities</span></p>
            `;
        } else {
            container.innerHTML = `
                <p class="${smallText}">Available for</p>
                <p class="${smallText} ${muted}">opportunities</p>
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
