# My AI Studio — Zero-budget Storyboard MVP

This is the first working prototype of My AI Studio. It is a mobile-friendly Progressive Web App (PWA).

## What works
- Story input
- Basic local story splitting into scenes
- Basic character-name detection
- Editable storyboard descriptions and visual prompts
- Character reference descriptions
- Save projects in the current browser using localStorage
- Export project JSON
- Copy all scene prompts
- English, Bangla, Hindi and Urdu interface headings
- PWA manifest and service worker

## What does not work yet
- No real LLM-powered story analysis
- No image/video generation
- No voice generation, music, lip sync or final MP4 rendering
- No cloud account sync or multi-user backend

## Run
Open `index.html` in a browser for a quick local test. For PWA installation, host the folder on an HTTPS static host. Service workers require HTTPS or localhost.

## Android-only workflow
1. Create a GitHub account in your Android browser.
2. Create a new public repository named `my-ai-studio`.
3. Upload all files from this folder.
4. Enable GitHub Pages in repository Settings → Pages → Deploy from branch → main → /(root).
5. Open the published HTTPS site in Chrome on Android.
6. Chrome menu → Add to Home screen / Install app.

GitHub Pages availability and account UI may change. Public repositories are visible to everyone, so do not put secrets or API keys in this project.

## Next development milestones
1. Replace heuristic scene splitting with an LLM adapter.
2. Add secure FastAPI backend and PostgreSQL.
3. Add model adapters for image and video generation.
4. Add a GPU worker and FFmpeg render pipeline.
5. Add account authentication, quotas and private project storage before public beta.
