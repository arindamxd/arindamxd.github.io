// Use async IIFE to handle top-level await properly
(async () => {
    try {
        const metadataModule = await import('../content/testimonials-metadata.json');
        const metadata = metadataModule.default;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        const testimonials = metadata.data;
        if (!testimonials || testimonials.length === 0) {
            console.error('No testimonials data found!');
            return;
        }

        let currentIndex = 0; // To track the current testimonial index
        let storyInterval = 0; // To hold the interval ID
        const STORY_DURATION = 5; // seconds

        // Get DOM elements with error checking
        const progressBarsContainer = document.getElementById('progressBarsContainer');
        const screenBg = document.getElementById('screenBg');
        const testimonialPerson = document.getElementById('testimonialPerson');
        const starsIcon = document.getElementById('starsIcon');
        const testimonialText = document.getElementById('testimonialText');
        const testimonialAuthor = document.getElementById('testimonialAuthor');
        const testimonialPosition = document.getElementById('testimonialPosition');
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');

        // Check if all required elements exist
        const requiredElements = {
            progressBarsContainer,
            testimonialPerson,
            starsIcon,
            testimonialText,
            testimonialAuthor,
            testimonialPosition,
            screenBg,
            prevButton,
            nextButton,
        };

        const missingElements = Object.entries(requiredElements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);

        if (missingElements.length > 0) {
            console.error('Missing required DOM elements:', missingElements);
            return;
        }

        function createProgressBars() {
            progressBarsContainer.innerHTML = '';
            testimonials.forEach((_, index) => {
                const segment = document.createElement('div');
                segment.classList.add('progress-bar-segment');
                segment.style.opacity = '1';
                segment.innerHTML = `
                    <div class="progress-bar-row main-flex" style="background-color: rgba(255, 255, 255, 0.33); height: 100%; width: 100%; border-radius: 10px; will-change: auto;">
                        <div class="overlay-container">
                            <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
                                <div class="progress-bar-fill" style="position: absolute; top: 0px; left: 0px; height: 5px; width: 0%; background-color: #ffffff;"></div>
                            </div>
                        </div>
                    </div>
                `;
                progressBarsContainer.appendChild(segment);
            });
        }

        function updateProgressBars(index) {
            const segments = progressBarsContainer.children;

            // Reset all segments first
            for (let i = 0; i < segments.length; i++) {
                segments[i].classList.remove('active', 'filled');
                segments[i].querySelector('.progress-bar-fill').style.transition = 'none';
                segments[i].querySelector('.progress-bar-fill').style.width = '0%';
            }

            // Mark all previous segments as filled
            for (let i = 0; i < index; i++) {
                const fill = segments[i].querySelector('.progress-bar-fill');
                fill.style.transition = 'none';
                fill.style.width = '100%';
                segments[i].classList.add('filled');
            }

            // Force a reflow to restart CSS transition (critical for backward direction)
            void segments[index].offsetWidth;

            // Now re-enable the animation for the active one
            const currentFill = segments[index].querySelector('.progress-bar-fill');
            currentFill.style.transition = `width ${STORY_DURATION}s linear`;
            currentFill.style.width = '100%';
            segments[index].classList.add('active');
        }

        function showTestimonial(index) {
            updateProgressBars(index); // Start progress bar animation immediately

            setTimeout(() => {
                const testimonial = testimonials[index];
                testimonialPerson.style.display = 'flex';
                starsIcon.style.display = 'block';
                testimonialText.textContent = testimonial.text;
                testimonialAuthor.textContent = testimonial.author;
                testimonialPosition.textContent = testimonial.position;
                screenBg.src = testimonial.background;
            }, 100); // Corresponds to the transition duration
        }

        function nextTestimonial(click) {
            if (click && currentIndex === testimonials.length - 1) { return; }
            currentIndex = (currentIndex + 1) % testimonials.length;
            showTestimonial(currentIndex);
            resetInterval();
        }

        function prevTestimonial(click) {
            if (click && currentIndex === 0) { return; }
            currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
            showTestimonial(currentIndex);
            resetInterval();
        }

        function startInterval() {
            storyInterval = setInterval(() => nextTestimonial(false), STORY_DURATION * 1000);
        }

        function resetInterval() {
            clearInterval(storyInterval);
            startInterval();
        }

        // Event Listeners
        prevButton.addEventListener('click', () => prevTestimonial(true));
        nextButton.addEventListener('click', () => nextTestimonial(true));

        // Initialize
        createProgressBars();
        showTestimonial(currentIndex);
        startInterval();
    } catch (error) {
        console.error('Error initializing testimonial slider:', error);
        console.error('Error stack:', error.stack);
    }
})();
