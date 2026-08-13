// Testimonial phone slider — re-inits on Astro view transitions
import { bootOnce } from './boot-once';

(async () => {
    if (!bootOnce('testimonials')) return;
    try {
        type Testimonial = {
            text: string;
            author: string;
            position: string;
            background: string;
        };

        type BoundControls = {
            prevButton: HTMLElement;
            nextButton: HTMLElement;
            onPrev: () => void;
            onNext: () => void;
        };

        function isTestimonial(value: unknown): value is Testimonial {
            if (!value || typeof value !== 'object') return false;
            const t = value as Record<string, unknown>;
            return (
                typeof t.text === 'string' &&
                typeof t.author === 'string' &&
                typeof t.position === 'string' &&
                typeof t.background === 'string'
            );
        }

        function readTestimonials(): Testimonial[] | null {
            const el = document.getElementById('testimonials-data');
            if (!el) return null;
            try {
                const data: unknown = JSON.parse(el.textContent || '[]');
                if (!Array.isArray(data)) return null;
                return data.filter(isTestimonial);
            } catch {
                return null;
            }
        }

        let testimonials: Testimonial[] = readTestimonials() ?? [];
        if (testimonials.length === 0) {
            // Fallback for pages that still rely on the catalog JSON
            const metadataModule = await import('../content/testimonials-metadata.json');
            const raw = metadataModule.default?.data;
            testimonials = Array.isArray(raw) ? raw.filter(isTestimonial) : [];
        }

        if (!testimonials || testimonials.length === 0) {
            console.error('No testimonials data found!');
            return;
        }

        let currentIndex = 0;
        let storyInterval: ReturnType<typeof setInterval> | 0 = 0;
        let bound: BoundControls | null = null;
        let onVisibility: (() => void) | null = null;
        const STORY_DURATION = 5;

        function cleanup(): void {
            clearInterval(storyInterval);
            storyInterval = 0;
            if (onVisibility) {
                document.removeEventListener('visibilitychange', onVisibility);
                onVisibility = null;
            }
            if (bound) {
                bound.prevButton.removeEventListener('click', bound.onPrev);
                bound.nextButton.removeEventListener('click', bound.onNext);
                bound = null;
            }
        }

        function init(): void {
            cleanup();

            const next = readTestimonials();
            if (next?.length) testimonials = next;

            const progressBarsContainer = document.getElementById('progressBarsContainer');
            const screenBg = document.getElementById('screenBg');
            const testimonialPerson = document.getElementById('testimonialPerson');
            const starsIcon = document.getElementById('starsIcon');
            const testimonialText = document.getElementById('testimonialText');
            const testimonialAuthor = document.getElementById('testimonialAuthor');
            const testimonialPosition = document.getElementById('testimonialPosition');
            const prevButton = document.getElementById('prevButton');
            const nextButton = document.getElementById('nextButton');

            if (
                !progressBarsContainer ||
                !testimonialPerson ||
                !starsIcon ||
                !testimonialText ||
                !testimonialAuthor ||
                !testimonialPosition ||
                !screenBg ||
                !prevButton ||
                !nextButton
            ) {
                return;
            }

            if (!(screenBg instanceof HTMLImageElement)) return;
            const bgImage = screenBg;

            currentIndex = 0;

            function createProgressBars(): void {
                progressBarsContainer!.innerHTML = '';
                testimonials.forEach(() => {
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
                    progressBarsContainer!.appendChild(segment);
                });
            }

            function updateProgressBars(index: number): void {
                const segments = progressBarsContainer!.children;

                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    if (!(segment instanceof HTMLElement)) continue;
                    segment.classList.remove('active', 'filled');
                    const fill = segment.querySelector('.progress-bar-fill');
                    if (!(fill instanceof HTMLElement)) continue;
                    fill.style.transition = 'none';
                    fill.style.width = '0%';
                }

                for (let i = 0; i < index; i++) {
                    const segment = segments[i];
                    if (!(segment instanceof HTMLElement)) continue;
                    const fill = segment.querySelector('.progress-bar-fill');
                    if (!(fill instanceof HTMLElement)) continue;
                    fill.style.transition = 'none';
                    fill.style.width = '100%';
                    segment.classList.add('filled');
                }

                const activeSegment = segments[index];
                if (!(activeSegment instanceof HTMLElement)) return;
                void activeSegment.offsetWidth;

                const currentFill = activeSegment.querySelector('.progress-bar-fill');
                if (!(currentFill instanceof HTMLElement)) return;
                currentFill.style.transition = `width ${STORY_DURATION}s linear`;
                currentFill.style.width = '100%';
                activeSegment.classList.add('active');
            }

            function showTestimonial(index: number): void {
                updateProgressBars(index);

                const testimonial = testimonials[index];
                if (!testimonial) return;
                testimonialPerson!.style.display = 'flex';
                starsIcon!.style.display = 'block';
                testimonialText!.textContent = testimonial.text;
                testimonialAuthor!.textContent = testimonial.author;
                testimonialPosition!.textContent = testimonial.position;
                bgImage.src = testimonial.background;
            }

            function nextTestimonial(click: boolean): void {
                if (click && currentIndex === testimonials.length - 1) return;
                currentIndex = (currentIndex + 1) % testimonials.length;
                showTestimonial(currentIndex);
                resetInterval();
            }

            function prevTestimonial(click: boolean): void {
                if (click && currentIndex === 0) return;
                currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
                showTestimonial(currentIndex);
                resetInterval();
            }

            function startInterval(): void {
                storyInterval = setInterval(() => nextTestimonial(false), STORY_DURATION * 1000);
            }

            function resetInterval(): void {
                clearInterval(storyInterval);
                startInterval();
            }

            const onPrev = () => prevTestimonial(true);
            const onNext = () => nextTestimonial(true);
            prevButton.addEventListener('click', onPrev);
            nextButton.addEventListener('click', onNext);
            bound = { prevButton, nextButton, onPrev, onNext };

            createProgressBars();
            showTestimonial(currentIndex);
            startInterval();

            onVisibility = () => {
                if (document.hidden) {
                    clearInterval(storyInterval);
                    storyInterval = 0;
                } else if (!storyInterval) {
                    startInterval();
                }
            };
            document.addEventListener('visibilitychange', onVisibility);
        }

        document.addEventListener('astro:page-load', init);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } catch (error: unknown) {
        console.error('Error initializing testimonial slider:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
    }
})();
