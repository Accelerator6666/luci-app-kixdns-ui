'use strict';
'require view';
'require rpc';
'require ui';

var callStatus = rpc.declare({ object: 'luci.kixdns', method: 'status', expect: {} });
var callService = rpc.declare({ object: 'luci.kixdns', method: 'service', params: [ 'action' ], expect: {} });

function badge(text, good) {
	return E('span', { 'class': good ? 'label success' : 'label warning', 'style': 'display:inline-block;min-width:84px;text-align:center' }, text);
}

return view.extend({
	load: function() { return callStatus(); },
	action: function(action) {
		ui.showModal(_('KixDNS'), [ E('p', { 'class': 'spinning' }, _('Applying service action…')) ]);
		return callService(action).then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, (res && (res.message || res.error)) || _('Action finished.')), res && res.ok ? 'info' : 'error');
			window.setTimeout(function() { window.location.reload(); }, 700);
		});
	},
	render: function(data) {
		data = data || {};
		var rows = [
			[ _('Service'), badge(data.running ? _('Running') : _('Stopped'), !!data.running) ],
			[ _('Autostart'), badge(data.enabled ? _('Enabled') : _('Disabled'), !!data.enabled) ],
			[ _('PID'), String(data.pid || '-') ],
			[ _('KixDNS version'), data.version || '-' ],
			[ _('Configuration'), data.config_path || '/etc/kixdns/pipeline.json' ],
			[ _('JSON validation'), badge(data.config_valid ? _('Valid') : _('Invalid'), !!data.config_valid) ],
			[ _('UDP bind'), data.bind_udp || '-' ],
			[ _('TCP bind'), data.bind_tcp || '-' ],
			[ _('Latest backup'), data.last_backup || _('None') ],
			[ _('Official visual editor'), badge(data.editor_installed ? _('Installed') : _('Not installed'), !!data.editor_installed) ],
			[ _('Editor SHA256'), data.editor_sha256 || '-' ],
			[ _('Editor last synced'), data.editor_updated || '-' ]
		];
		return E([], [
			E('h2', {}, _('KixDNS Overview')),
			E('div', { 'class': 'cbi-map-descr' }, _('Management UI for an existing KixDNS deployment. It does not alter dnsmasq, firewall, dae routing, or DNS hijacking rules.')),
			E('div', { 'class': 'table' }, rows.map(function(row) {
				return E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td left', 'style': 'width:230px;font-weight:600' }, row[0]), E('div', { 'class': 'td left' }, row[1]) ]);
			})),
			E('h3', {}, _('Listeners')),
			E('pre', { 'style': 'white-space:pre-wrap;max-height:220px;overflow:auto' }, data.listener || _('No matching listener found')),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.action, 'start') }, _('Start')), ' ',
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.action, 'restart') }, _('Restart')), ' ',
				E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, this.action, 'stop') }, _('Stop')), ' ',
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.action, data.enabled ? 'disable' : 'enable') }, data.enabled ? _('Disable autostart') : _('Enable autostart'))
			])
		]);
	},
	handleSaveApply: null, handleSave: null, handleReset: null
});
