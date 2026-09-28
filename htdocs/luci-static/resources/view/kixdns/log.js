'use strict';
'require view';
'require poll';
'require ui';
'require kixdns.common as kix';

return view.extend({
	load: function() {
		return kix.callGetLog(250);
	},

	refresh: function() {
		var limit = Number(document.getElementById('kixdns-log-limit').value || 250);
		return kix.callGetLog(limit).then(function(res) {
			var el = document.getElementById('kixdns-log-output');
			if (el) el.textContent = (res && res.output) || _('No KixDNS log entries found.');
		});
	},

	clear: function() {
		if (!window.confirm(_('Clear the KixDNS log file?'))) return;
		return kix.callClearLog().then(function(res) {
			kix.notify((res && (res.message || res.error)) || _('Log cleared.'), res && res.ok ? 'info' : 'error');
			return this.refresh();
		}.bind(this));
	},

	render: function(data) {
		var self = this;
		var paused = false;

		var node = E([], [
			E('h2', {}, _('KixDNS Logs')),
			E('div', { 'class': 'cbi-map-descr' }, _('Live log viewer. Auto refresh runs every 5 seconds while this page is open.')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, [
				E('label', {}, _('Lines') + ': '),
				E('select', { 'id': 'kixdns-log-limit', 'class': 'cbi-input-select', 'change': ui.createHandlerFn(this, this.refresh) }, [
					50, 100, 250, 500
				].map(function(n) { return E('option', { 'value': n, 'selected': n === 250 ? '' : null }, String(n)); })),
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.refresh) }, _('Refresh')),
				E('button', {
					'id': 'kixdns-log-pause',
					'class': 'btn cbi-button',
					'click': function(ev) {
						paused = !paused;
						ev.target.textContent = paused ? _('Resume') : _('Pause');
					}
				}, _('Pause')),
				E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, this.clear) }, _('Clear'))
			]),
			E('pre', {
				'id': 'kixdns-log-output',
				'style': 'white-space:pre-wrap;max-height:70vh;overflow:auto;margin-top:12px'
			}, (data && data.output) || _('No KixDNS log entries found.'))
		]);

		poll.add(function() {
			if (paused) return Promise.resolve();
			return self.refresh();
		}, 5);

		return node;
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
