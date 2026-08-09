/**
 * /tools/author — blog & project markdown authoring + download
 */
(function () {
    const STORAGE_KEY = 'tools-author-draft-v1';

    const BLOG_INSERTS: Record<string, string> = {
        section: '## Section heading\n\nBody paragraph…',
        subtitle: '### Supporting heading\n\n- **Label**: explanation\n- Plain item',
        labeled: '- **Label**: explanation\n- **Another**: explanation',
        code: '```swift\nlet button = UIButton(type: .system)\n```',
    };

    const PROJECT_INSERTS: Record<string, string> = {
        pair: '![Image Small Top Left](https://)\n![Image Small Top Right](https://)',
        large: '![Image Large Middle](https://)',
        section: '## Section heading\n\nBody paragraph for this section.',
        trio: '![Image Small Bottom Left](https://)\n![Image Small Bottom Right](https://)\n![Image Large Bottom](https://)',
    };

    type FormFieldValue = string | boolean;
    type FormDataMap = Record<string, FormFieldValue>;

    function isFormControl(
        el: Element | RadioNodeList | null,
    ): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
        return (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement
        );
    }

    function val(form: HTMLFormElement, name: string): string {
        const el = form.elements.namedItem(name);
        if (!isFormControl(el)) return '';
        return String(el.value ?? '').trim();
    }

    function slugify(raw: unknown): string {
        return String(raw || '')
            .toLowerCase()
            .trim()
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function yamlQuote(s: unknown): string {
        return `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    function downloadBlob(filename: string, text: string, mime?: string): void {
        const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function insertAtCursor(textarea: HTMLTextAreaElement | null, snippet: string): void {
        if (!textarea) return;
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? start;
        const before = textarea.value.slice(0, start);
        const after = textarea.value.slice(end);
        let prefix = '';
        if (before.length && !/\n\n$/.test(before)) {
            prefix = before.endsWith('\n') ? '\n' : '\n\n';
        }
        let suffix = '\n';
        if (after.length && !after.startsWith('\n')) suffix = '\n\n';
        else if (after.startsWith('\n') && !after.startsWith('\n\n')) suffix = '\n';

        const block = prefix + snippet + suffix;
        textarea.value = before + block + after;
        const pos = before.length + block.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function bodyValue(form: HTMLFormElement): string {
        const el = form.elements.namedItem('body');
        if (!isFormControl(el)) return '';
        return String(el.value ?? '').replace(/\s+$/, '');
    }

    function buildBlogMd(form: HTMLFormElement): string {
        const introTitle = val(form, 'introTitle') || val(form, 'listTitle');
        const description = val(form, 'introDescription');
        const banner = val(form, 'banner');
        const body = bodyValue(form);

        const lines = [
            '---',
            `title: ${yamlQuote(introTitle)}`,
            `description: ${yamlQuote(description)}`,
            `banner: ${yamlQuote(banner)}`,
            '---',
            '',
        ];
        if (body) lines.push(body);
        return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
    }

    function buildBlogJson(form: HTMLFormElement, root: HTMLElement): string {
        let slug = slugify(val(form, 'slug'));
        if (!slug) slug = slugify(val(form, 'listTitle')) || 'post';
        return (
            JSON.stringify(
                {
                    slug,
                    title: val(form, 'listTitle') || val(form, 'introTitle') || 'Untitled',
                    thumb: val(form, 'thumb'),
                    author: {
                        name: val(form, 'authorName') || root.dataset.authorName || '',
                        avatar: val(form, 'authorAvatar') || root.dataset.authorAvatar || '',
                    },
                    date: val(form, 'date') || root.dataset.today || '',
                    content: `blogs/${slug}.md`,
                },
                null,
                4
            ) + '\n'
        );
    }

    function buildProjectMd(form: HTMLFormElement): string {
        const body = bodyValue(form);
        return body ? body + '\n' : '';
    }

    function buildProjectJson(form: HTMLFormElement, root: HTMLElement): string {
        let slug = slugify(val(form, 'slug'));
        if (!slug) slug = slugify(val(form, 'title')) || 'project';

        const downloads = val(form, 'downloads');
        const link = val(form, 'link');
        const sourceCode = val(form, 'source_code');
        const privacyEl = form.elements.namedItem('privacy_policy');
        const privacyPolicy =
            privacyEl instanceof HTMLInputElement && privacyEl.checked === true;

        const entry = {
            slug,
            title: val(form, 'title') || 'Untitled',
            desc: {
                short: val(form, 'descShort'),
                long: val(form, 'descLong'),
            },
            images: {
                thumb: val(form, 'thumb'),
                thumb_bg_color: val(form, 'thumbBg') || 'rgb(42, 41, 255)',
                banner: val(form, 'banner'),
            },
            header: {
                organization: val(form, 'organization'),
                category: val(form, 'category'),
                released_date: val(form, 'released') || root.dataset.today || '',
                updated_date: val(form, 'updated') || root.dataset.today || '',
                ...(downloads ? { downloads } : {}),
                ...(link ? { link } : {}),
            },
            content: `projects/${slug}.md`,
            ...(sourceCode ? { source_code: sourceCode } : {}),
            ...(privacyPolicy ? { privacy_policy: true } : {}),
        };

        return JSON.stringify(entry, null, 4) + '\n';
    }

    function blogSlug(form: HTMLFormElement): string {
        return slugify(val(form, 'slug')) || slugify(val(form, 'listTitle')) || 'post';
    }

    function projectSlug(form: HTMLFormElement): string {
        return slugify(val(form, 'slug')) || slugify(val(form, 'title')) || 'project';
    }

    function serializeForm(form: HTMLFormElement): FormDataMap {
        const data: FormDataMap = {};
        Array.from(form.elements).forEach((el) => {
            if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
                return;
            }
            if (!el.name || el.disabled) return;
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                data[el.name] = el.checked;
                return;
            }
            data[el.name] = el.value;
        });
        return data;
    }

    function hydrateForm(form: HTMLFormElement, data: unknown): void {
        if (!data || typeof data !== 'object') return;
        const map = data as FormDataMap;
        Object.keys(map).forEach((key) => {
            const el = form.elements.namedItem(key);
            if (!isFormControl(el)) return;
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                el.checked = Boolean(map[key]);
                return;
            }
            el.value = String(map[key] ?? '');
        });
    }

    function wireAutoSlug(form: HTMLFormElement, titleName: string): void {
        const slugEl = form.elements.namedItem('slug');
        const titleEl = form.elements.namedItem(titleName);
        if (!isFormControl(slugEl) || !isFormControl(titleEl)) return;
        let locked = Boolean(String(slugEl.value || '').trim());
        slugEl.addEventListener('input', () => {
            locked = Boolean(String(slugEl.value || '').trim());
        });
        titleEl.addEventListener('input', () => {
            if (locked) return;
            slugEl.value = slugify(titleEl.value);
        });
    }

    function init(): void {
        const rootEl = document.getElementById('tools-app');
        if (!rootEl || rootEl.dataset.toolsReady === '1') return;
        const root = rootEl;
        root.dataset.toolsReady = '1';

        const formBlogEl = document.getElementById('form-blog');
        const formProjectEl = document.getElementById('form-project');
        const formBlog = formBlogEl instanceof HTMLFormElement ? formBlogEl : null;
        const formProject = formProjectEl instanceof HTMLFormElement ? formProjectEl : null;
        const panelBlog = document.getElementById('panel-blog');
        const panelProject = document.getElementById('panel-project');
        const previewBlog = document.getElementById('preview-blog');
        const previewProject = document.getElementById('preview-project');

        function refreshPreviews(): void {
            if (previewBlog && formBlog) previewBlog.textContent = buildBlogMd(formBlog);
            if (previewProject && formProject) previewProject.textContent = buildProjectMd(formProject);
        }

        function setMode(mode: string | null): void {
            if (mode !== 'blog' && mode !== 'project') return;
            const isBlog = mode === 'blog';
            root.querySelectorAll('[data-tools-tab]').forEach((btn) => {
                const on = btn.getAttribute('data-tools-tab') === mode;
                btn.classList.toggle('is-active', on);
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            if (panelBlog) panelBlog.hidden = !isBlog;
            if (panelProject) panelProject.hidden = isBlog;
            try {
                localStorage.setItem(STORAGE_KEY + ':mode', mode);
            } catch {
                /* ignore */
            }
        }

        function saveDrafts(): void {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        blog: formBlog ? serializeForm(formBlog) : null,
                        project: formProject ? serializeForm(formProject) : null,
                    })
                );
            } catch {
                /* ignore */
            }
        }

        function loadDrafts(): void {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed: unknown = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') {
                        const draft = parsed as { blog?: unknown; project?: unknown };
                        if (formBlog && draft.blog) hydrateForm(formBlog, draft.blog);
                        if (formProject && draft.project) hydrateForm(formProject, draft.project);
                    }
                }
            } catch {
                /* ignore */
            }
            try {
                const mode = localStorage.getItem(STORAGE_KEY + ':mode');
                if (mode === 'blog' || mode === 'project') setMode(mode);
            } catch {
                /* ignore */
            }
        }

        root.querySelectorAll('[data-tools-tab]').forEach((btn) => {
            btn.addEventListener('click', () => setMode(btn.getAttribute('data-tools-tab')));
        });

        root.querySelectorAll('[data-blog-insert]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-blog-insert');
                const ta = formBlog?.elements.namedItem('body');
                if (key && ta instanceof HTMLTextAreaElement && BLOG_INSERTS[key]) {
                    insertAtCursor(ta, BLOG_INSERTS[key]!);
                }
            });
        });

        root.querySelectorAll('[data-project-insert]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-project-insert');
                const ta = formProject?.elements.namedItem('body');
                if (key && ta instanceof HTMLTextAreaElement && PROJECT_INSERTS[key]) {
                    insertAtCursor(ta, PROJECT_INSERTS[key]!);
                }
            });
        });

        root.querySelectorAll('[data-download]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const kind = btn.getAttribute('data-download');
                if (kind === 'blog-md' && formBlog) {
                    downloadBlob(`${blogSlug(formBlog)}.md`, buildBlogMd(formBlog), 'text/markdown;charset=utf-8');
                } else if (kind === 'blog-json' && formBlog) {
                    downloadBlob(
                        `${blogSlug(formBlog)}.catalog.json`,
                        buildBlogJson(formBlog, root),
                        'application/json;charset=utf-8'
                    );
                } else if (kind === 'project-md' && formProject) {
                    downloadBlob(
                        `${projectSlug(formProject)}.md`,
                        buildProjectMd(formProject),
                        'text/markdown;charset=utf-8'
                    );
                } else if (kind === 'project-json' && formProject) {
                    downloadBlob(
                        `${projectSlug(formProject)}.catalog.json`,
                        buildProjectJson(formProject, root),
                        'application/json;charset=utf-8'
                    );
                }
            });
        });

        root.querySelectorAll('[data-copy]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const which = btn.getAttribute('data-copy');
                const text =
                    which === 'blog' && formBlog
                        ? buildBlogMd(formBlog)
                        : which === 'project' && formProject
                          ? buildProjectMd(formProject)
                          : '';
                if (!text) return;
                try {
                    await navigator.clipboard.writeText(text);
                    const prev = btn.textContent;
                    btn.textContent = 'Copied';
                    setTimeout(() => {
                        btn.textContent = prev;
                    }, 1200);
                } catch {
                    /* ignore */
                }
            });
        });

        [formBlog, formProject].forEach((form) => {
            if (!form) return;
            form.addEventListener('input', () => {
                refreshPreviews();
                saveDrafts();
            });
            form.addEventListener('change', () => {
                refreshPreviews();
                saveDrafts();
            });
        });

        if (formBlog) wireAutoSlug(formBlog, 'listTitle');
        if (formProject) wireAutoSlug(formProject, 'title');

        loadDrafts();
        refreshPreviews();
    }

    init();
    document.addEventListener('astro:page-load', init);
})();
