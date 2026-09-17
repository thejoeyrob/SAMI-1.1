# SAMI — Consolidated Repository v1.1.0

SAMI (Spatial Analysis & Mapping Intelligence) is an installable site-planning PWA.

## Runtime policy
- Desktop browsers may run the workspace directly.
- Phones and tablets must install SAMI to the Home Screen / app launcher before the workspace is exposed.
- Where `beforeinstallprompt` is supported, the installation button invokes the native browser prompt.
- iOS/iPadOS Safari does not expose a programmable Add to Home Screen prompt; the installation gate therefore shows the Share → Add to Home Screen instructions and does not provide a browser-workspace bypass.

## Launch experience
The sales introduction is part of the same PWA. Installed/mobile and desktop launches open the sales film first. **Skip intro** enters the workspace immediately. `meet.html` remains shareable as the standalone presentation route but uses the same manifest and service worker.

## Deployment
The deployable PWA files live at repository root. GitHub Pages can publish the root directly. A Pages workflow is included under `.github/workflows/pages.yml`.

## Licensing
Retain the included third-party licence notices.


## v1.0.1 update
- Integrated matrix/process-overload sales intro, SAMI pin/CAD-plan formation and Start Planning hand-off.
- Complete sidebar collapse.
- Explore-mode note/photo markers default to field-only; promote them to issued drawings from selection.
- Close SAMI action plays branded shutdown animation; platform restrictions may prevent programmatic window dismissal.


## v1.0.2 update
- Refined integrated intro sequence with restored central pin impact, slower smoother motion, denser matrix-style word population, overload collapse, and SAMI letter resolve sequence.

## v1.1.0 update
- Rebuilt the full launch film: centre pin impact, progressive 3D root/CAD growth, varied Matrix-style process terms, overload/retraction, proposition copy and a smooth SAMI letter/pin resolve.
- Added the clean welcome state with **Ask SAMI**, **Start planning** and **Why ask SAMI?** replay.
- Made the desktop/iPad sidebar and asset groups use the full available width with a fixed compact tool row and full-sidebar collapse.
- Restored Explore-mode note/photo capture, defaulting to field-only unless explicitly included on the issued drawing.
- Fixed hatch and dot patterns so they cover the complete selected polygon, including large areas.
