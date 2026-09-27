# luci-app-kixdns-ui v0.2.0

First public development release of the LuCI management UI for KixDNS on OpenWrt.

## Highlights

- Native LuCI pages for KixDNS status, configuration, backups and diagnostics.
- Official KixDNS `config_editor.html` integration without redistributing the upstream editor.
- Automatically loads the router's current `/etc/kixdns/pipeline.json` into the visual editor.
- Safe configuration apply workflow with timestamped backups.
- Hot reload for ordinary Pipeline/routing changes.
- Automatic KixDNS restart when known engine-initialization settings change.
- Post-apply process, listener and DNS health checks.
- Automatic rollback to the previous configuration when verification fails.
- Raw JSON editor for advanced/manual configuration.
- Backup history, diff and point-in-time restore.
- DNS query diagnostics and GeoIP/GeoSite data-file checks.
- Optional integration with an existing `/usr/bin/dae-kixdns-check` script.
- GitHub Actions static checks for JSON, shell and JavaScript syntax.

## Design principles

This project is intentionally non-invasive. It manages KixDNS itself and its configuration lifecycle, but does not automatically rewrite:

- dnsmasq
- nftables/firewall
- dae routing
- DHCP
- DNS hijacking

Existing network policy remains under the administrator's control.

## Visual editor

The LuCI UI can explicitly fetch the official KixDNS visual configuration editor from:

`https://raw.githubusercontent.com/olicesx/kixdns/main/tools/config_editor.html`

The downloaded editor is sanity-checked and its SHA-256 is shown in LuCI.

Because the upstream editor tracks KixDNS `main`, fields exposed by the editor may be newer than an installed KixDNS binary. Use **Save & Apply safely** and run Diagnostics after changes.

## Development installation

```sh
cd /tmp
wget -O luci-app-kixdns-ui.zip \
  https://github.com/Accelerator6666/luci-app-kixdns-ui/archive/refs/heads/main.zip
```

Extract the archive, then:

```sh
cd luci-app-kixdns-ui-main
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

## Recommended first-run sequence

1. Verify **Overview**.
2. Run **Diagnostics** before changing configuration.
3. Open **Visual Editor** and download the official editor.
4. Verify the current `pipeline.json` loads correctly.
5. Make a harmless rule-only change.
6. Use **Save & Apply safely**.
7. Confirm the apply mode reports `hot_reload`.
8. Run Diagnostics again.
9. Confirm a pre-write backup appears under **Backups**.

## License

GPL-3.0-only.

KixDNS and its official visual editor are separate upstream works and retain their upstream copyright/license notices.
