'use strict';
'require view';
'require ui';
'require kixdns.common as kix';

function renderChecks(items) {
	if (!items.length)
		return E('div', { 'class': 'alert-message notice' }, _('No structured check results were returned.'));

	return E('div', { 'class': 'table' }, items.map(function(item) {
		var good = item.state === 'PASS';
		var neutral = item.state === 'WARN';
		return E('div', { 'class': 'tr' }, [
			E('div', { 'class': 'td left', 'style': 'width:110px' }, kix.badge(item.state, good, neutral)),
			E('div', { 'class': 'td left' }, item.text)
		]);
	}));
}

return view.extend({
	query: function() {
		var domain = document.getElementById('diag-domain').value.trim();
		var qtype = document.getElementById('diag-qtype').value;
		var out = document.getElementById('diag-output');
		out.textContent = _('Running DNS query…');
		return kix.callDiagnose(domain, qtype).then(function(res) {
			out.textContent = (res && res.output) || (res && res.error) || _('No output');
			if (res && res.server) out.textContent = 'Server: ' + res.server + '\n\n' + out.textContent;
			if (!res || !res.ok) kix.notify((res && res.error) || _('DNS query failed.'), 'error');
		});
	},

	check: function() {
		var out = document.getElementById('check-output');
		out.textContent = _('Running self-check…');
		return kix.callSelfCheck().then(function(res) {
			var items = kix.parseSelfCheck(res && res.report);
			out.replaceChildren(renderChecks(items));
			kix.notify(res && res.ok ? _('Core KixDNS self-check passed.') : _('Core KixDNS self-check reported a failure.'), res && res.ok ? 'info' : 'error');
		});
	},

	render: function() {
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
			E('h3', {}, _('Health checks')),
			E('p', {}, E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, this.check) }, _('Run self-check'))),
			E('div', { 'id': 'check-output' }, E('div', { 'class': 'alert-message notice' }, _('Run the self-check to see structured health results.')))
		]);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
