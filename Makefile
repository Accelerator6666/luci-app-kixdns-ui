# SPDX-License-Identifier: GPL-3.0-only
#
# LuCI management UI for an existing KixDNS installation.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-kixdns-ui
PKG_VERSION:=0.2.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0-only

LUCI_TITLE:=LuCI management UI for KixDNS
LUCI_DESCRIPTION:=KixDNS status, official visual-editor bridge, safe apply/rollback, backups and diagnostics
LUCI_DEPENDS:=+luci-base +rpcd +jsonfilter +drill +ca-bundle
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
