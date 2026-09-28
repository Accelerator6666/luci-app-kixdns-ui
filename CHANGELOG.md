# Changelog

## 0.3.0 - 2026-09-28

- Added shared LuCI RPC/UI helpers in `kixdns/common.js`.
- Reworked Overview into a live dashboard with 5-second polling, process memory and listener-health state.
- Reworked Diagnostics to render PASS/FAIL/WARN checks as structured status rows.
- Added a dedicated live Logs page with line-count selection, auto refresh, pause/resume and controlled log clearing.
- Added `clear_log` rpcd method and corresponding least-privilege ACL entry.
- Updated GitHub Actions checkout to v7 and expanded JavaScript syntax checks to shared resource files.
- Preserved the existing safe-apply, hot-reload/restart classification, health verification and rollback behavior.

## 0.2.0 - 2026-09-26

- Reworked the project around the upstream KixDNS visual config editor instead of maintaining a parallel Pipeline form implementation.
- Added on-demand upstream editor download with sanity checks, SHA-256 and sync metadata.
- Added same-origin LuCI bridge that loads the router's current `pipeline.json` into the official editor and reads edited JSON back for safe apply.
- Added hot-reload versus restart classification based on KixDNS engine-initialization settings.
- Added health verification and automatic rollback after failed apply.
- Added backup list, diff and point-in-time restore.
- Added dynamic listener-aware DNS diagnostics and GeoIP/GeoSite file checks.
- Added optional execution of an existing `/usr/bin/dae-kixdns-check` integration check.
- Replaced the v0.1 quick-settings form with a Raw JSON fallback page.
- Changed project license from MIT to GPL-3.0-only.

## 0.1.0 - 2026-09-26

- Initial prototype with service status, quick settings, raw JSON, backup/rollback and diagnostics.
