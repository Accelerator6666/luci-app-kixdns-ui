#!/bin/sh
set -eu

if [ ! -d /www/luci-static/resources ]; then
	echo "ERROR: run this installer on an OpenWrt router with LuCI installed." >&2
	exit 1
fi

[ -x /usr/bin/kixdns ] || echo "WARNING: /usr/bin/kixdns was not found; UI installation will continue." >&2

mkdir -p /www/luci-static/resources/view/kixdns
mkdir -p /usr/share/luci/menu.d /usr/share/rpcd/acl.d /usr/libexec/rpcd
mkdir -p /etc/kixdns/backups

cp -f htdocs/luci-static/resources/view/kixdns/*.js /www/luci-static/resources/view/kixdns/
cp -f root/usr/share/luci/menu.d/luci-app-kixdns-ui.json /usr/share/luci/menu.d/
cp -f root/usr/share/rpcd/acl.d/luci-app-kixdns-ui.json /usr/share/rpcd/acl.d/
cp -f root/usr/libexec/rpcd/luci.kixdns /usr/libexec/rpcd/luci.kixdns
chmod 755 /usr/libexec/rpcd/luci.kixdns

rm -f /tmp/luci-indexcache 2>/dev/null || true
rm -rf /tmp/luci-modulecache/* 2>/dev/null || true
/etc/init.d/rpcd restart
/etc/init.d/uhttpd reload >/dev/null 2>&1 || true

echo "Installed luci-app-kixdns-ui development files."
echo "Re-login to LuCI -> Services -> KixDNS."
echo "The official KixDNS config editor is NOT bundled. Fetch it from Visual Editor when needed."
