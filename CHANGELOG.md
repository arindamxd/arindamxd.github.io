# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [SemVer](https://semver.org/). Site version lives in [`package.json`](package.json); agent memory mirrors it in [`AGENTS.md`](AGENTS.md).

## [Unreleased]

### Added

- Home GitHub contributions calendar (`react-github-calendar` React island) before footer
- Shared `SectionHeading` element (centered title + muted description) used across home marketing sections
- Contributions section copy + usernames in `contributions-metadata.json`
- Gallery `preview` paths for Skills, Brands, and Contributions (dummy data; no live leak / no network)

### Changed

- Feature sheets use Tailwind `@apply` for layout/type/token colors (keep glass, keyframes, prose, and state machines as plain CSS); credentials accordion CSS moved into `utils.css`
- Page-scoped `tools.css` / `design.css` `@reference` `global.css` for `@apply` theme access
- Skills, credentials, testimonials, projects, blogs, and contributions sections share `SectionHeading`
- `/design` Layout sample mounts live `SectionHeading` (no hand mock)
- Brands metadata shape is `{ title, logos[] }`; credentials accordion binds per-root (multi-instance safe)

### Fixed

## [1.0.3] — 2026-08-09

### Added

- Living `/design` gallery with live section/page mounts (`preview`) and dummy data (`design-preview-data.ts`)
- Gallery media shell + project logo **A** placeholders; site-wide broken-image fallback (`image-fallback.js`)
- Design system docs + Cursor rule coverage for gallery, nav glass, and theme-toggle clip layer
- Git-tracked project memory ([`AGENTS.md`](AGENTS.md)) with version table, content/skills/tools map
- Private `/tools` suite (author, markdown preview, scramble compare) and expanded design-system recipes
- CC BY 4.0 license with attribution requirements
- Root [`CHANGELOG.md`](CHANGELOG.md) for ongoing product release notes

### Changed

- Reorganized site CSS into feature sheets (`nav`, `hero`, `projects`, …) under `global.css`
- `/design` Components mounts live `NavBar preview` on the gradient demo shell
- Testimonials slider prefers embedded `#testimonials-data` (supports gallery dummy quotes)

### Fixed

- Frosted nav / theme toggle: clip icons on `.nav-theme-toggle__clip` so `backdrop-filter` stays intact
- Nav glass rules documented (no same-node `overflow: hidden` / `transform` / view-transition name)

## [1.0.2] — 2026-08-09

### Changed

- Package release bump (see tag `v1.0.2`)

## [1.0.1] — prior

See git tag `v1.0.1` and commit history for earlier notes.

[Unreleased]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/arindamxd/arindamxd.github.io/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/arindamxd/arindamxd.github.io/releases/tag/v1.0.1
