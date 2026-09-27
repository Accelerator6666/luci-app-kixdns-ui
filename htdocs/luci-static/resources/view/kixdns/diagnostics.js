'use strict';
'require view';
'require rpc';
'require ui';

var callDiagnose = rpc.declare({ object: 'luci.kixdns', method: 'diagnose', params: [ 'domain', 'qtype' ], expect: {} });
var callSelfCheck = rpc.declare({ object: 'luci.kixdns', method: 'self_check', expect: {} });
var callGetLog = rpc.declare({ object: 'luci.kixdns', method: 'get_log', params: [ 'limit' ], expect: {} });

return view.extend({
	load: function() { return callGetLog(120); },
	query: function() {
		var domain = document.getElementById('diag-domain').value.trim();
		var qtype = document.getElementById('diag-qtype').value;
		var out = document.getElementById('diag-output');
		out.textContent = _('Running DNS query…');
		return callDiagnose(domain, qtype).then(function(res) {
			out.textContent = (res && res.output) || (res && res.error) || _('No output');
			if (res && res.server) out.textContent = 'Server: ' + res.server + '\n\n' + out.textContent;
			if (!res || !res.ok) ui.addNotification(null, E('p', {}, (res && res.error) || _('DNS query failed.')), 'error');
		});
	},
	check: function() {
		var out = document.getElementById('check-output');
		out.textContent = _('Running self-check…');
		return callSelfCheck().then(function(res) {
			out.textContent = (res && res.report) || (res && res.error) || _('No output');
			ui.addNotification(null, E('p', {}, res && res.ok ? _('Core KixDNS self-check passed.') : _('Core KixDNS self-check reported a failure.')), res && res.ok ? 'info' : 'error');
		});
	},
	refresh: function() {
		return callGetLog(250).then(function(res) { document.getElementById('log-output').textContent = (res && res.output) || _('No KixDNS log entries found.'); });
	},
	render: function(data) {
		return E([], [
			E('h2', {}, _('KixDNS Diagnostics')),
			E('h3', {}, _('DNS query')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain / record type')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'id': 'diag-domain', 'class': 'cbi-input-text', 'value': 'www.baidu.com' }), ' ',
					E('select', { 'id': 'diag-qtype', 'class': 'cbi-input-select' }, [ 'A','AAAA','CNAME','MX','TXT','NS','PTR','SOA','SRV' ].map(function(t) { return E('option', { 'value': t }, t); })), ' ',
					E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.query) }, _('Query'))
				])
			]),
			E('pre', { 'id': 'diag-output', 'style': 'white-space:pre-wrap;max-height:320px;overflow:auto' }, _('Query output will appear here.')),
			E('h3', {}, _('Self-check')),
			E('p', {}, E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.check) }, _('Run self-check'))),
			E('pre', { 'id': 'check-output', 'style': 'white-space:pre-wrap;max-height:520px;overflow:auto' }, _('Self-check output will appear here.')),
			E('h3', {}, _('Recent log')),
			E('p', {}, E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, this.refresh) }, _('Refresh log'))),
			E('pre', { 'id': 'log-output', 'style': 'white-space:pre-wrap;max-height:420px;overflow:auto' }, (data && data.output) || _('No KixDNS log entries found.'))
		]);
	},
	handleSaveApply: null, handleSave: null, handleReset: null
});
