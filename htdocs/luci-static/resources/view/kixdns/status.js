'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require kixdns.common as kix';

function row(title, value) {
	return E('div', { 'class': 'tr' }, [
		E('div', { 'class': 'td left', 'style': 'width:230px;font-weight:600' }, title),
		E('div', { 'class': 'td left' }, value)
	]);
}

return view.extend({
	load: function() { return kix.callStatus(); },

	action: function(action) {
		ui.showModal(_('KixDNS'), [ E('p', { 'class': 'spinning' }, _('Applying service action…')) ]);
		return kix.callService(action).then(function(res) {
			ui.hideModal();
			kix.notify((res && (res.message || res.error)) || _('Action finished.'), res && res.ok ? 'info' : 'error');
			return kix.callStatus();
		}).then(this.update.bind(this));
	},

	update: function(data) {
		data = data || {};
		var state = document.getElementById('kixdns-state');
		var auto = document.getElementById('kixdns-autostart');
		var pid = document.getElementById('kixdns-pid');
		var mem = document.getElementById('kixdns-memory');
		var ver = document.getElementById('kixdns-version');
		var valid = document.getElementById('kixdns-config-valid');
		var listener = document.getElementById('kixdns-listener-state');
		var listeners = document.getElementById('kixdns-listeners');

		if (state) dom.content(state, kix.badge(data.running ? _('Running') : _('Stopped'), !!data.running));
		if (auto) dom.content(auto, kix.badge(data.enabled ? _('Enabled') : _('Disabled'), !!data.enabled));
		if (pid) pid.textContent = String(data.pid || '-');
		if (mem) mem.textContent = kix.formatBytes(data.memory_kb);
		if (ver) ver.textContent = data.version || '-';
		if (valid) dom.content(valid, kix.badge(data.config_valid ? _('Valid') : _('Invalid'), !!data.config_valid));
		if (listener) dom.content(listener, kix.badge(data.listener_ok ? _('Listening') : _('Not listening'), !!data.listener_ok));
		if (listeners) listeners.textContent = data.listener || _('No matching listener found');
	},

	render: function(data) {
		data = data || {};
		var table = E('div', { 'class': 'table' }, [
			row(_('Service'), E('span', { 'id': 'kixdns-state' }, kix.badge(data.running ? _('Running') : _('Stopped'), !!data.running))),
			row(_('Autostart'), E('span', { 'id': 'kixdns-autostart' }, kix.badge(data.enabled ? _('Enabled') : _('Disabled'), !!data.enabled))),
			row(_('PID'), E('span', { 'id': 'kixdns-pid' }, String(data.pid || '-'))),
			row(_('Memory'), E('span', { 'id': 'kixdns-memory' }, kix.formatBytes(data.memory_kb))),
			row(_('KixDNS version'), E('span', { 'id': 'kixdns-version' }, data.version || '-')),
			row(_('Configuration'), data.config_path || '/etc/kixdns/pipeline.json'),
			row(_('JSON validation'), E('span', { 'id': 'kixdns-config-valid' }, kix.badge(data.config_valid ? _('Valid') : _('Invalid'), !!data.config_valid))),
			row(_('Listener health'), E('span', { 'id': 'kixdns-listener-state' }, kix.badge(data.listener_ok ? _('Listening') : _('Not listening'), !!data.listener_ok))),
			row(_('UDP bind'), data.bind_udp || '-'),
			row(_('TCP bind'), data.bind_tcp || '-'),
			row(_('Latest backup'), data.last_backup || _('None')),
			row(_('Official visual editor'), kix.badge(data.editor_installed ? _('Installed') : _('Not installed'), !!data.editor_installed))
		]);

		var node = E([], [
			E('h2', {}, _('KixDNS Overview')),
			E('div', { 'class': 'cbi-map-descr' }, _('Live service overview. Status refreshes automatically every 5 seconds. This UI does not alter dnsmasq, firewall, dae routing, or DNS hijacking rules.')),
			table,
			E('h3', {}, _('Listeners')),
			E('pre', { 'id': 'kixdns-listeners', 'style': 'white-space:pre-wrap;max-height:220px;overflow:auto' }, data.listener || _('No matching listener found')),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.action, 'start') }, _('Start')), ' ',
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.action, 'restart') }, _('Restart')), ' ',
				E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, this.action, 'stop') }, _('Stop')), ' ',
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.action, data.enabled ? 'disable' : 'enable') }, data.enabled ? _('Disable autostart') : _('Enable autostart'))
			])
		]);

		poll.add(L.bind(function() {
			return kix.callStatus().then(this.update.bind(this));
		}, this), 5);

		return node;
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
