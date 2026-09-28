# luci-app-kixdns-ui

LuCI management UI for an existing [KixDNS](https://github.com/olicesx/kixdns) installation on OpenWrt.

This project is intentionally **non-invasive**: it manages KixDNS itself and `/etc/kixdns/pipeline.json`; it does not automatically rewrite dnsmasq, nftables/firewall rules, dae routing, DHCP, or DNS hijacking.

## v0.3.0 scope

- Live Overview: service state, PID, memory usage, version, listener health, listener addresses, config validity and official-editor status; refreshes every 5 seconds.
- Official Visual Editor bridge: fetches `tools/config_editor.html` directly from the upstream KixDNS repository on demand, serves it locally, auto-loads the router's current `pipeline.json`, and can save/apply the resulting JSON back through rpcd.
- Safe apply engine:
  - creates a timestamped backup before every write;
  - uses KixDNS hot reload for ordinary routing/Pipeline changes;
  - automatically restarts KixDNS when known engine-initialization settings change;
  - verifies process/listener/DNS health;
  - restores the previous config and restarts KixDNS if verification fails.
- Raw JSON editor as an advanced escape hatch.
- Backup history, diff and restore.
- Structured DNS diagnostics with PASS/FAIL/WARN health rows, GeoIP/GeoSite file checks, and optional integration with `/usr/bin/dae-kixdns-check` when that script already exists.
- Dedicated live Logs page with 50/100/250/500-line views, pause/resume, refresh, and controlled log clearing.
- Shared LuCI RPC/UI helper module under `htdocs/luci-static/resources/kixdns/common.js` to reduce duplicated page logic.

## Why the official editor is fetched instead of bundled

KixDNS upstream ships `tools/config_editor.html`, a static Vue/Bootstrap/Mermaid editor. This project does not redistribute that file. The **Visual Editor** page explicitly downloads the current upstream copy from:

`https://raw.githubusercontent.com/olicesx/kixdns/main/tools/config_editor.html`

The downloaded file is sanity-checked, stored at `/www/kixdns-editor/config_editor.html`, and its SHA-256 plus sync time are shown in LuCI.

This separation has two advantages:

1. the OpenWrt integration remains small and focused on service/config lifecycle;
2. upstream KixDNS keeps ownership of its configuration schema/editor implementation.

The upstream editor loads Vue 3, Bootstrap 5 and Mermaid from public CDNs, so the **browser opening LuCI** must be able to reach those CDN URLs.

## KixDNS reload model

Current upstream KixDNS documentation states that valid JSON changes are watched and hot-reloaded. It also states that listener addresses, UDP worker count, TLS DoH listener, connection-pool construction, cache construction and other engine-initialization parameters are created at startup and require a service restart when changed.

v0.3.0 continues to use a conservative restart classifier. Changes to fields such as listener/TLS paths, pool sizing, connection lifecycle settings, flow-control construction, cache construction, `dashmap_shards`, and `geoip_db_path` trigger a restart. Ordinary Pipeline/rule/upstream changes use hot reload.

The classifier is intentionally conservative. A restart is preferable to silently assuming a runtime field is hot-reloadable when the installed KixDNS build differs from upstream `main`.

## Compatibility warning

The upstream config editor follows the KixDNS `main` branch. Your installed binary can be older and may reject or ignore fields exposed by a newer editor. The LuCI bridge shows the binary-reported version but cannot guarantee schema compatibility across arbitrary builds.

Every write is backed up. Test changes through **Save & Apply safely** and Diagnostics rather than assuming a field is supported by the installed binary.

## Development install on OpenWrt

Copy the project directory to the router, for example:

```sh
scp -r luci-app-kixdns-ui root@10.0.0.1:/tmp/
```

Then on OpenWrt:

```sh
cd /tmp/luci-app-kixdns-ui
./install-dev.sh
```

Re-login to LuCI and open:

```text
Services
└── KixDNS
    ├── Overview
    ├── Visual Editor
    ├── Raw JSON
    ├── Backups
    └── Diagnostics
```

The development installer does **not** restart KixDNS and does not touch `pipeline.json`. It only installs LuCI/rpcd files and reloads the web/RPC services.

## First-run test sequence

1. Open **Overview** and confirm the service, version, configured listener and JSON state look correct.
2. Open **Diagnostics** and run the self-check before changing anything.
3. Open **Visual Editor** and click **Download official editor**.
4. After the iframe loads, verify that the current router config was automatically loaded into the upstream editor.
5. Make a harmless Pipeline/rule change and use **Save & Apply safely**.
6. Confirm that the notification reports `hot_reload` for a normal rule-only change.
7. Run Diagnostics again.
8. Review **Backups** and confirm the pre-write backup exists.

Do not start by changing `bind_udp`/`bind_tcp`; those intentionally trigger a service restart.

## Runtime paths

```text
/etc/kixdns/pipeline.json
/etc/kixdns/backups/
/etc/kixdns/editor.meta
/www/kixdns-editor/config_editor.html
/usr/libexec/rpcd/luci.kixdns
/www/luci-static/resources/kixdns/common.js
/www/luci-static/resources/view/kixdns/
```

## Security notes

- rpcd ACL separates read and write methods.
- backup restore accepts only `pipeline.json.*.bak` basenames; path traversal is rejected.
- config writes are capped at 512 KiB and must parse as JSON before installation.
- official-editor downloads are capped/sanity-checked before installation and are only initiated explicitly from the UI.
- `pipeline.json` and backups are written with restrictive permissions where possible.
- the official editor is third-party/upstream code fetched at runtime; review the displayed SHA-256 if reproducibility matters.

## Building as an OpenWrt LuCI package

Place this directory into an OpenWrt package/feed tree and build it through the standard LuCI build system. Package metadata is in `Makefile`.

Dependencies:

- `luci-base`
- `rpcd`
- `jsonfilter`
- `drill`
- `ca-bundle`

KixDNS itself is intentionally not declared as a package dependency because deployments may install it manually.

## License

This integration project is licensed under **GPL-3.0-only**.

KixDNS and its official config editor are separate upstream works. See the upstream repository for their license and notices.
