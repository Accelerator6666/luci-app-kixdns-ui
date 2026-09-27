'use strict';
'require view';
'require rpc';
'require ui';

var callGetConfig = rpc.declare({
	object: 'luci.kixdns',
	method: 'get_config',
	expect: {}
});

var callApplyConfig = rpc.declare({
	object: 'luci.kixdns',
	method: 'apply_config',
	params: [ 'content' ],
	expect: {}
});

var callSaveConfig = rpc.declare({
	object: 'luci.kixdns',
	method: 'save_config',
	params: [ 'content' ],
	expect: {}
});

var callSyncEditor = rpc.declare({
	object: 'luci.kixdns',
	method: 'sync_editor',
	expect: {}
});

function getFrame() {
	return document.getElementById('kixdns-editor-frame');
}

function getEditorTextarea() {
	var frame = getFrame();
	if (!frame || !frame.contentDocument)
		throw new Error(_('Official editor is not ready yet.'));
	var ta = frame.contentDocument.querySelector('.preview-pane textarea');
	if (!ta)
		throw new Error(_('Could not find the JSON editor inside the official KixDNS editor. The upstream editor may have changed.'));
	return ta;
}

function findLoadButton(doc) {
	var buttons = doc.querySelectorAll('button');
	for (var i = 0; i < buttons.length; i++) {
		var txt = (buttons[i].textContent || '').trim();
		if (txt.indexOf('加载 JSON') >= 0 || txt.indexOf('Load JSON') >= 0)
			return buttons[i];
	}
	return null;
}

return view.extend({
	load: function() {
		return callGetConfig();
	},

	injectConfig: function(raw, quiet) {
		var frame = getFrame();
		if (!frame || !frame.contentDocument)
			throw new Error(_('Editor iframe is not available.'));
		var ta = getEditorTextarea();
		ta.value = raw || '{}';
		ta.dispatchEvent(new Event('input', { bubbles: true }));
		var btn = findLoadButton(frame.contentDocument);
		if (!btn)
			throw new Error(_('The upstream editor Load JSON button was not found.'));
		window.setTimeout(function() { btn.click(); }, 80);
		if (!quiet)
			ui.addNotification(null, E('p', {}, _('Current /etc/kixdns/pipeline.json was loaded into the visual editor.')));
	},

	handleFrameLoad: function(raw) {
		var self = this;
		window.setTimeout(function() {
			try { self.injectConfig(raw, true); }
			catch (e) {
				ui.addNotification(null, E('p', {}, e.message), 'warning');
			}
		}, 700);
	},

	handleReloadCurrent: function() {
		var self = this;
		return callGetConfig().then(function(res) {
			try { self.injectConfig((res && res.content) || '{}', false); }
			catch (e) { ui.addNotification(null, E('p', {}, e.message), 'error'); }
		});
	},

	readEditorJson: function() {
		var text = getEditorTextarea().value;
		try {
			JSON.parse(text);
		}
		catch (e) {
			throw new Error(_('Invalid JSON in visual editor: ') + e.message);
		}
		return text;
	},

	handleSave: function(apply) {
		var text;
		try { text = this.readEditorJson(); }
		catch (e) {
			ui.addNotification(null, E('p', {}, e.message), 'error');
			return;
		}

		ui.showModal(_('KixDNS'), [
			E('p', { 'class': 'spinning' }, apply ? _('Saving and applying configuration…') : _('Saving configuration without applying…'))
		]);
		var req = apply ? callApplyConfig(text) : callSaveConfig(text);
		return req.then(function(res) {
			ui.hideModal();
			if (res && res.ok) {
				var msg = res.message || _('Configuration saved.');
				if (res.apply_mode)
					msg += ' [' + res.apply_mode + ']';
				if (res.restart_fields)
					msg += ' ' + _('Restart-triggering fields: ') + res.restart_fields;
				ui.addNotification(null, E('p', {}, msg));
			}
			else {
				var err = (res && res.error) || _('Operation failed.');
				if (res && res.rolled_back)
					err += ' ' + _('The previous configuration was restored automatically.');
				ui.addNotification(null, E('p', {}, err), 'error');
			}
		});
	},

	handleSyncEditor: function() {
		if (!window.confirm(_('Download/replace the local visual editor with the current official KixDNS config_editor.html from GitHub?')))
			return;
		ui.showModal(_('KixDNS'), [ E('p', { 'class': 'spinning' }, _('Downloading official KixDNS editor…')) ]);
		return callSyncEditor().then(function(res) {
			ui.hideModal();
			if (res && res.ok) {
				ui.addNotification(null, E('p', {}, (res.message || _('Editor updated.')) + ' SHA256=' + (res.editor_sha256 || '-')));
				window.setTimeout(function() { window.location.reload(); }, 800);
			}
			else {
				ui.addNotification(null, E('p', {}, (res && res.error) || _('Editor download failed.')), 'error');
			}
		});
	},

	renderMissing: function(data) {
		return E([], [
			E('h2', {}, _('KixDNS Visual Editor')),
			E('div', { 'class': 'alert-message warning' }, [
				E('strong', {}, _('Official editor is not installed locally. ')),
				_('This package intentionally does not redistribute the upstream editor. Use the button below to fetch it directly from the official KixDNS GitHub repository.')
			]),
			E('p', {}, [ _('Source: '), E('code', {}, data.editor_url || '') ]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.handleSyncEditor) }, _('Download official editor'))
			])
		]);
	},

	render: function(data) {
		data = data || {};
		if (!data.editor_installed)
			return this.renderMissing(data);

		var raw = data.content || '{}';
		var version = data.version || _('unknown');
		var frame = E('iframe', {
			'id': 'kixdns-editor-frame',
			'src': data.editor_path || '/kixdns-editor/config_editor.html',
			'style': 'width:100%;height:78vh;border:1px solid var(--border-color-medium,#ccc);background:#fff',
			'load': ui.createHandlerFn(this, this.handleFrameLoad, raw)
		});

		return E([], [
			E('h2', {}, _('KixDNS Visual Editor')),
			E('div', { 'class': 'alert-message warning' }, [
				E('strong', {}, _('Compatibility notice: ')),
				_('The embedded editor tracks KixDNS upstream main, while your installed binary reports '),
				E('code', {}, version),
				_('. Upstream may expose fields newer than your binary. Every write is backed up; Apply uses hot reload unless an engine-initialization field changed, in which case KixDNS is restarted.')
			]),
			E('div', { 'class': 'cbi-map-descr' }, [
				_('Editor SHA256: '), E('code', {}, data.editor_sha256 || '-'),
				' · ', _('Last synced: '), data.editor_updated || '-'
			]),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom:12px' }, [
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.handleReloadCurrent) }, _('Reload current router config into editor')),
				' ',
				E('button', { 'class': 'btn cbi-button cbi-button-save', 'click': ui.createHandlerFn(this, this.handleSave, false) }, _('Save only')),
				' ',
				E('button', { 'class': 'btn cbi-button cbi-button-apply', 'click': ui.createHandlerFn(this, this.handleSave, true) }, _('Save & Apply safely')),
				' ',
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.handleSyncEditor) }, _('Update official editor')),
				' ',
				E('a', { 'class': 'btn cbi-button', 'href': data.editor_path || '/kixdns-editor/config_editor.html', 'target': '_blank', 'rel': 'noopener' }, _('Open editor full screen'))
			]),
			frame
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
