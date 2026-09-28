'use strict';
'require baseclass';
'require rpc';
'require ui';

var callStatus = rpc.declare({ object: 'luci.kixdns', method: 'status', expect: {} });
var callService = rpc.declare({ object: 'luci.kixdns', method: 'service', params: [ 'action' ], expect: {} });
var callGetConfig = rpc.declare({ object: 'luci.kixdns', method: 'get_config', expect: {} });
var callSaveConfig = rpc.declare({ object: 'luci.kixdns', method: 'save_config', params: [ 'content' ], expect: {} });
var callApplyConfig = rpc.declare({ object: 'luci.kixdns', method: 'apply_config', params: [ 'content' ], expect: {} });
var callRestoreLast = rpc.declare({ object: 'luci.kixdns', method: 'restore_last', expect: {} });
var callDiagnose = rpc.declare({ object: 'luci.kixdns', method: 'diagnose', params: [ 'domain', 'qtype' ], expect: {} });
var callSelfCheck = rpc.declare({ object: 'luci.kixdns', method: 'self_check', expect: {} });
var callGetLog = rpc.declare({ object: 'luci.kixdns', method: 'get_log', params: [ 'limit' ], expect: {} });
var callClearLog = rpc.declare({ object: 'luci.kixdns', method: 'clear_log', expect: {} });

function notify(message, type) {
	ui.addNotification(null, E('p', {}, message || _('Operation completed.')), type || 'info');
}

function badge(text, good, neutral) {
	var cls = neutral ? 'label notice' : (good ? 'label success' : 'label warning');
	return E('span', {
		'class': cls,
		'style': 'display:inline-block;min-width:88px;text-align:center'
	}, text);
}

function formatBytes(kib) {
	var n = Number(kib || 0) * 1024;
	if (!n) return '-';
	if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KiB';
	return (n / 1024 / 1024).toFixed(1) + ' MiB';
}

function parseSelfCheck(report) {
	var items = [];
	String(report || '').split(/\n/).forEach(function(line) {
		var m = line.match(/^\[(PASS|FAIL|WARN)\]\s*(.*)$/);
		if (!m) return;
		items.push({ state: m[1], text: m[2] });
	});
	return items;
}

return baseclass.extend({
	callStatus: callStatus,
	callService: callService,
	callGetConfig: callGetConfig,
	callSaveConfig: callSaveConfig,
	callApplyConfig: callApplyConfig,
	callRestoreLast: callRestoreLast,
	callDiagnose: callDiagnose,
	callSelfCheck: callSelfCheck,
	callGetLog: callGetLog,
	callClearLog: callClearLog,
	notify: notify,
	badge: badge,
	formatBytes: formatBytes,
	parseSelfCheck: parseSelfCheck
});
