![CameraX screenshot — photo mode](/assets/projects/camerax/screenshot-1.jpg)
![CameraX screenshot — video recording](/assets/projects/camerax/screenshot-2.jpg)

## A Play Store camera app that shows Jetpack CameraX in practice

CameraX is an open-source Kotlin app on Google Play (100K+ downloads), built with Jetpack CameraX 1.6 and Compose. It is a reference other apps can copy: still capture with flash, timer, grid, pinch zoom, and tap-to-focus; video with pause, mute, and 60 fps when listed; high-speed slo-mo when the device supports it; live ColorMatrix effects on `ImageAnalysis`; horizontal panorama; and concurrent front + back Dual preview. Unsupported OEM chips stay hidden, and bind failures fall back instead of crashing.

![CameraX screenshot — gallery browse and share](/assets/projects/camerax/screenshot-3.jpg)

## Modes, Extensions, and patterns you can reuse

Swipe Photo / Video / Slo-mo / Effects / Pano / Dual on the live feed; the gear opens full Settings for quality, aspect ratio, stabilization, Ultra HDR, RAW/DNG, and theme. ExtensionsManager powers HDR, Night, Portrait, and Beauty on capable devices. The codebase follows package-level Clean Architecture (`ui` → `domain` ← `data`) with a single `:app` module — start at `CameraRepository` and `CameraSession` if you are wiring CameraX into another project. Source: [github.com/arindamxd/camerax-android](https://github.com/arindamxd/camerax-android).

![CameraX screenshot — live color effects](/assets/projects/camerax/screenshot-4.jpg)
![CameraX screenshot — settings](/assets/projects/camerax/screenshot-5.jpg)
![CameraX screenshot — HDR Night Portrait extensions](/assets/projects/camerax/screenshot-6.jpg)
