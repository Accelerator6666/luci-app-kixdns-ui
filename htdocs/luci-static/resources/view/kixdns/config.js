'use strict';
'require view';
'require rpc';
'require ui';

var callGetConfig = rpc.declare({ object: 'luci.kixdns', method: 'get_config', expect: {} });
var callSaveConfig = rpc.declare({ object: 'luci.kixdns', method: 'save_config', params: [ 'content' ], expect: {} });
var callApplyConfig = rpc.declare({ object: 'luci.kixdns', method: 'apply_config', params: [ 'content' ], expect: {} });
var callRestoreLast = rpc.declare({ object: 'luci.kixdns', method: 'restore_last', expect: {} });

return view.extend({
	load: function() { return callGetConfig(); },

	read: function() {
		var text = document.getElementById('kixdns-json').value;
		try { JSON.parse(text); }
		catch (e) { throw new Error(_('Invalid JSON: ') + e.message); }
		return text;
	},

	format: function() {
		try {
			var el = document.getElementById('kixdns-json');
			el.value = JSON.stringify(JSON.parse(el.value), null, 2);
		}
		catch (e) { ui.addNotification(null, E('p', {}, _('Invalid JSON: ') + e.message), 'error'); }
	},

	write: function(apply) {
		var text;
		try { text = this.read(); }
		catch (e) { ui.addNotification(null, E('p', {}, e.message), 'error'); return; }
		ui.showModal(_('KixDNS'), [ E('p', { 'class': 'spinning' }, apply ? _('Saving and applying…') : _('Saving…')) ]);
		return (apply ? callApplyConfig(text) : callSaveConfig(text)).then(function(res) {
			ui.hideModal();
			if (res && res.ok) {
				var msg = res.message || _('Saved.');
				if (res.apply_mode) msg += ' [' + res.apply_mode + ']';
				if (res.restart_fields) msg += ' ' + _('Restart-triggering fields: ') + res.restart_fields;
				ui.addNotification(null, E('p', {}, msg));
			}
			else {
				var msg2 = (res && res.error) || _('Operation failed.');
				if (res && res.rolled_back) msg2 += ' ' + _('Previous configuration restored automatically.');
				ui.addNotification(null, E('p', {}, msg2), 'error');
			}
		});
	},

	restore: function() {
		if (!window.confirm(_('Restore the latest backup and restart KixDNS?'))) return;
		return callRestoreLast().then(function(res) {
			if (res && res.ok) {
				ui.addNotification(null, E('p', {}, res.message));
				window.setTimeout(function() { window.location.reload(); }, 600);
			} else ui.addNotification(null, E('p', {}, (res && res.error) || _('Restore failed.')), 'error');
		});
	},

	render: function(data) {
		data = data || {};
		return E([], [
			E('h2', {}, _('KixDNS Raw JSON')),
			E('div', { 'class': 'cbi-map-descr' }, [
				_('Advanced escape hatch for direct pipeline.json editing. Visual Editor is preferred for normal changes. Unknown fields are preserved because this page writes the JSON exactly as supplied.'),
				E('br'), _('Latest backup: '), E('code', {}, data.last_backup || _('None'))
			]),
			E('textarea', {
				'id': 'kixdns-json', 'class': 'cbi-input-textarea', 'wrap': 'off', 'spellcheck': 'false',
				'style': 'width:100%;min-height:620px;font-family:monospace;white-space:pre'
			}, data.content || '{}'),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.format) }, _('Format JSON')),
				' ', E('button', { 'class': 'btn cbi-button cbi-button-save', 'click': ui.createHandlerFn(this, this.write, false) }, _('Save only')),
				' ', E('button', { 'class': 'btn cbi-button cbi-button-apply', 'click': ui.createHandlerFn(this, this.write, true) }, _('Save & Apply safely')),
				' ', E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, this.restore) }, _('Restore latest backup'))
			])
		]);
	},
	handleSaveApply: null, handleSave: null, handleReset: null
});
