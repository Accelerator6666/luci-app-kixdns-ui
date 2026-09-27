'use strict';
'require view';
'require rpc';
'require ui';

var callList = rpc.declare({ object: 'luci.kixdns', method: 'list_backups', expect: {} });
var callRestore = rpc.declare({ object: 'luci.kixdns', method: 'restore_backup', params: [ 'name' ], expect: {} });
var callDiff = rpc.declare({ object: 'luci.kixdns', method: 'diff_backup', params: [ 'name' ], expect: {} });

return view.extend({
	load: function() { return callList(); },
	showDiff: function(name) {
		ui.showModal(_('Configuration diff'), [ E('p', { 'class': 'spinning' }, _('Comparing backup with current pipeline.json…')) ]);
		return callDiff(name).then(function(res) {
			if (!res || !res.ok) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, (res && res.error) || _('Diff failed.')), 'error');
				return;
			}
			ui.showModal(_('Configuration diff: ') + name, [
				E('pre', { 'style': 'white-space:pre-wrap;max-height:65vh;overflow:auto;min-width:60vw' }, res.identical ? _('No differences.') : (res.output || _('No output.'))),
				E('div', { 'class': 'right' }, E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close')))
			]);
		});
	},
	restore: function(name) {
		if (!window.confirm(_('Restore backup %s? The current config will first be backed up, then KixDNS will restart.').format(name))) return;
		ui.showModal(_('KixDNS'), [ E('p', { 'class': 'spinning' }, _('Restoring backup…')) ]);
		return callRestore(name).then(function(res) {
			ui.hideModal();
			if (res && res.ok) {
				ui.addNotification(null, E('p', {}, res.message || _('Backup restored.')));
				window.setTimeout(function() { window.location.reload(); }, 800);
			} else ui.addNotification(null, E('p', {}, (res && res.error) || _('Restore failed.')), 'error');
		});
	},
	render: function(data) {
		data = data || {};
		var list = data.backups || [];
		return E([], [
			E('h2', {}, _('KixDNS Backups')),
			E('div', { 'class': 'cbi-map-descr' }, _('A timestamped backup is created before every configuration write. Up to the newest 30 backups are shown here.')),
			list.length ? E('table', { 'class': 'table cbi-section-table' }, [
				E('tr', { 'class': 'tr table-titles' }, [ E('th', { 'class': 'th' }, _('Backup')), E('th', { 'class': 'th' }, _('Timestamp')), E('th', { 'class': 'th' }, _('Size')), E('th', { 'class': 'th' }, _('Actions')) ]),
				list.map(function(b) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, E('code', {}, b.name)),
						E('td', { 'class': 'td' }, b.stamp || '-'),
						E('td', { 'class': 'td' }, String(b.size || 0) + ' B'),
						E('td', { 'class': 'td' }, [
							E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.showDiff, b.name) }, _('Diff')), ' ',
							E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, this.restore, b.name) }, _('Restore'))
						])
					]);
				}, this)
			]) : E('div', { 'class': 'alert-message notice' }, _('No backups found yet.'))
		]);
	},
	handleSaveApply: null, handleSave: null, handleReset: null
});
