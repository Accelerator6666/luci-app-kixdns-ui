#!/bin/sh
set -eu

rm -f /www/luci-static/resources/view/kixdns/status.js \
      /www/luci-static/resources/view/kixdns/editor.js \
      /www/luci-static/resources/view/kixdns/config.js \
      /www/luci-static/resources/view/kixdns/backups.js \
      /www/luci-static/resources/view/kixdns/diagnostics.js
rm -f /usr/share/luci/menu.d/luci-app-kixdns-ui.json
rm -f /usr/share/rpcd/acl.d/luci-app-kixdns-ui.json
rm -f /usr/libexec/rpcd/luci.kixdns
rm -rf /www/kixdns-editor
rm -f /etc/kixdns/editor.meta
rm -f /tmp/luci-indexcache 2>/dev/null || true
rm -rf /tmp/luci-modulecache/* 2>/dev/null || true
/etc/init.d/rpcd restart
/etc/init.d/uhttpd reload >/dev/null 2>&1 || true

echo "UI removed. /etc/kixdns/pipeline.json and /etc/kixdns/backups were left untouched."
