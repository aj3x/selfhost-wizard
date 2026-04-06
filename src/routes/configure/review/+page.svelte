<script lang="ts">
	import { configurator } from '$lib/stores/configurator';
	import { findService } from '$lib/services/registry';
	import { generateAll, collectNetworks, generateCompose } from '$lib/calc/compose';
	import { validate } from '$lib/calc/dependencies';

	let allIds = $derived([...$configurator.selectedServices, ...$configurator.resolvedDependencies]);
	let errors = $derived(validate($configurator));
	let output = $derived(generateAll($configurator));
	let networks = $derived(collectNetworks(generateCompose($configurator)));

	let activeTab = $state<'compose' | 'env' | 'setup' | 'caddyfile' | 'readme'>('compose');
	let copyStatus = $state('');

	// Resource totals
	let totalRAM = $derived.by(() => {
		let ram = 0;
		for (const id of allIds) {
			const svc = findService(id);
			if (svc) ram += svc.resourceEstimate.ramMB;
		}
		return ram;
	});

	let totalStorage = $derived.by(() => {
		let storage = 0;
		for (const id of allIds) {
			const svc = findService(id);
			if (svc) storage += svc.resourceEstimate.storageGB;
		}
		return storage;
	});

	let hasVpnRouted = $derived(allIds.some((id) => {
		const svc = findService(id);
		return svc?.vpnRouted && allIds.includes('gluetun');
	}));

	function getFileContent(): string {
		switch (activeTab) {
			case 'compose': return output.composeYaml;
			case 'env': return output.envFile;
			case 'setup': return output.setupScript;
			case 'caddyfile': return output.caddyfile || '';
			case 'readme': return output.readme;
		}
	}

	function getFileName(): string {
		switch (activeTab) {
			case 'compose': return 'docker-compose.yml';
			case 'env': return '.env';
			case 'setup': return 'setup.sh';
			case 'caddyfile': return 'Caddyfile';
			case 'readme': return 'README.md';
		}
	}

	async function copyToClipboard() {
		await navigator.clipboard.writeText(getFileContent());
		copyStatus = 'Copied!';
		setTimeout(() => (copyStatus = ''), 2000);
	}

	function downloadFile() {
		const blob = new Blob([getFileContent()], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = getFileName();
		a.click();
		URL.revokeObjectURL(url);
	}

	function getAllFiles(): { name: string; content: string }[] {
		const files = [
			{ name: 'docker-compose.yml', content: output.composeYaml },
			{ name: '.env', content: output.envFile },
			{ name: 'setup.sh', content: output.setupScript },
			{ name: 'README.md', content: output.readme }
		];
		if (output.caddyfile) {
			files.push({ name: 'Caddyfile', content: output.caddyfile });
		}
		return files;
	}

	async function downloadAllAsZip() {
		const files = getAllFiles();

		// Build a minimal valid ZIP file in-browser (no library needed)
		const encoder = new TextEncoder();
		const localFiles: { header: Uint8Array; data: Uint8Array; name: Uint8Array; crc: number }[] = [];
		let offset = 0;

		for (const file of files) {
			const data = encoder.encode(file.content);
			const name = encoder.encode(file.name);
			const crc = crc32(data);

			// Local file header (30 bytes + name length)
			const header = new Uint8Array(30 + name.length);
			const hv = new DataView(header.buffer);
			hv.setUint32(0, 0x04034b50, true); // signature
			hv.setUint16(4, 20, true); // version needed
			hv.setUint16(6, 0, true); // flags
			hv.setUint16(8, 0, true); // compression (store)
			hv.setUint16(10, 0, true); // mod time
			hv.setUint16(12, 0, true); // mod date
			hv.setUint32(14, crc, true); // crc32
			hv.setUint32(18, data.length, true); // compressed size
			hv.setUint32(22, data.length, true); // uncompressed size
			hv.setUint16(26, name.length, true); // name length
			hv.setUint16(28, 0, true); // extra length
			header.set(name, 30);

			localFiles.push({ header, data, name, crc });
			offset += header.length + data.length;
		}

		// Central directory
		const centralDir: Uint8Array[] = [];
		let localOffset = 0;
		for (const f of localFiles) {
			const cd = new Uint8Array(46 + f.name.length);
			const cv = new DataView(cd.buffer);
			cv.setUint32(0, 0x02014b50, true); // signature
			cv.setUint16(4, 20, true); // version made by
			cv.setUint16(6, 20, true); // version needed
			cv.setUint16(8, 0, true); // flags
			cv.setUint16(10, 0, true); // compression
			cv.setUint16(12, 0, true); // mod time
			cv.setUint16(14, 0, true); // mod date
			cv.setUint32(16, f.crc, true); // crc32
			cv.setUint32(20, f.data.length, true); // compressed size
			cv.setUint32(24, f.data.length, true); // uncompressed size
			cv.setUint16(28, f.name.length, true); // name length
			cv.setUint16(30, 0, true); // extra length
			cv.setUint16(32, 0, true); // comment length
			cv.setUint16(34, 0, true); // disk number
			cv.setUint16(36, 0, true); // internal attrs
			cv.setUint32(38, 0, true); // external attrs
			cv.setUint32(42, localOffset, true); // offset
			cd.set(f.name, 46);
			centralDir.push(cd);
			localOffset += f.header.length + f.data.length;
		}

		const cdSize = centralDir.reduce((s, c) => s + c.length, 0);

		// End of central directory
		const eocd = new Uint8Array(22);
		const ev = new DataView(eocd.buffer);
		ev.setUint32(0, 0x06054b50, true); // signature
		ev.setUint16(4, 0, true); // disk number
		ev.setUint16(6, 0, true); // cd disk
		ev.setUint16(8, localFiles.length, true); // entries on disk
		ev.setUint16(10, localFiles.length, true); // total entries
		ev.setUint32(12, cdSize, true); // cd size
		ev.setUint32(16, offset, true); // cd offset
		ev.setUint16(20, 0, true); // comment length

		// Combine all parts
		const parts: Uint8Array[] = [];
		for (const f of localFiles) {
			parts.push(f.header, f.data);
		}
		for (const cd of centralDir) {
			parts.push(cd);
		}
		parts.push(eocd);

		const totalSize = parts.reduce((s, p) => s + p.length, 0);
		const zip = new Uint8Array(totalSize);
		let pos = 0;
		for (const part of parts) {
			zip.set(part, pos);
			pos += part.length;
		}

		const blob = new Blob([zip], { type: 'application/zip' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'selfhost-wizard.zip';
		a.click();
		URL.revokeObjectURL(url);
	}

	// CRC32 lookup table
	const CRC_TABLE = (() => {
		const table = new Uint32Array(256);
		for (let i = 0; i < 256; i++) {
			let c = i;
			for (let j = 0; j < 8; j++) {
				c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
			}
			table[i] = c;
		}
		return table;
	})();

	function crc32(data: Uint8Array): number {
		let crc = 0xFFFFFFFF;
		for (let i = 0; i < data.length; i++) {
			crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
		}
		return (crc ^ 0xFFFFFFFF) >>> 0;
	}

	const tabs = $derived.by(() => {
		const t: { id: typeof activeTab; label: string }[] = [
			{ id: 'compose', label: 'docker-compose.yml' },
			{ id: 'env', label: '.env' },
			{ id: 'setup', label: 'setup.sh' },
		];
		if (output.caddyfile) {
			t.push({ id: 'caddyfile', label: 'Caddyfile' });
		}
		t.push({ id: 'readme', label: 'README.md' });
		return t;
	});
</script>

<svelte:head>
	<title>Review & Generate — SelfHost Wizard</title>
</svelte:head>

<div>
	<h1 class="mb-2 text-2xl font-bold">Review & Generate</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Review your configuration and download the generated files.
	</p>

	{#if allIds.length === 0}
		<div class="card p-8 text-center text-(--color-text-muted)">
			<p class="text-lg font-medium">No services selected</p>
			<p class="mt-1 text-sm">Go back to select some services to generate your configuration.</p>
		</div>
	{:else}

	{#if errors.length > 0}
		<div class="status-banner status-error" role="alert">
			<h2 class="mb-2 text-sm font-semibold text-(--color-danger)">Issues to resolve</h2>
			{#each errors as error}
				<p class="text-sm">{error.message}</p>
			{/each}
		</div>
	{/if}

	<section class="grid gap-4 sm:grid-cols-4" aria-label="Configuration summary">
		<div class="card text-center">
			<div class="text-2xl font-bold text-(--color-primary)">{allIds.length}</div>
			<div class="hint">Services</div>
		</div>
		<div class="card text-center">
			<div class="text-2xl font-bold text-(--color-primary)">
				{totalRAM >= 1024 ? `${(totalRAM / 1024).toFixed(1)} GB` : `${totalRAM} MB`}
			</div>
			<div class="hint">Estimated RAM</div>
		</div>
		<div class="card text-center">
			<div class="text-2xl font-bold text-(--color-primary)">
				{totalStorage >= 1 ? `${totalStorage.toFixed(1)} GB` : `${(totalStorage * 1024).toFixed(0)} MB`}
			</div>
			<div class="hint">Config Storage</div>
		</div>
		<div class="card text-center">
			<div class="text-2xl font-bold text-(--color-primary)">{networks.length}</div>
			<div class="hint">Networks</div>
		</div>
	</section>

	<section class="card" aria-labelledby="services-ports-heading">
		<h2 id="services-ports-heading" class="section-heading">Services & Ports</h2>
		<ul class="space-y-1" aria-label="Services and their port mappings">
			{#each allIds as id}
				{@const svc = findService(id)}
				{#if svc}
					<li class="flex items-center justify-between text-sm">
						<span>
							{svc.name}
							{#if svc.vpnRouted && hasVpnRouted}
								<span class="ml-1 text-[10px] rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600">VPN</span>
							{/if}
						</span>
						<span class="font-mono text-xs text-(--color-text-muted)">
							{#if svc.ports.length > 0}
								{#if svc.vpnRouted && hasVpnRouted}
									via gluetun {svc.ports.map((p) => `:${p.host}`).join(', ')}
								{:else}
									{svc.ports.map((p) => `:${p.host}`).join(', ')}
								{/if}
							{:else}
								—
							{/if}
						</span>
					</li>
				{/if}
			{/each}
		</ul>
	</section>

	<section class="card p-0" aria-label="Generated files">
		<div class="flex border-b border-(--color-border) overflow-x-auto" role="tablist" aria-label="File tabs">
			{#each tabs as tab}
				<button
					id="tab-{tab.id}"
					onclick={() => (activeTab = tab.id)}
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls="tabpanel-files"
					class="cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors
						focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-primary)
						{activeTab === tab.id
							? 'border-b-2 border-(--color-primary) font-medium text-(--color-primary)'
							: 'text-(--color-text-muted) hover:text-(--color-text)'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="flex items-center justify-end gap-2 border-b border-(--color-border) px-4 py-2">
			<span class="hint" aria-live="polite">{copyStatus}</span>
			<button onclick={copyToClipboard} class="btn-small">
				Copy
			</button>
			<button onclick={downloadFile} class="btn-small">
				Download
			</button>
		</div>

		<div id="tabpanel-files" role="tabpanel" aria-labelledby="tab-{activeTab}">
			<pre class="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed">{getFileContent()}</pre>
		</div>
	</section>

	<div class="flex items-center justify-center gap-4">
		<button onclick={downloadAllAsZip} class="btn-primary rounded-xl px-8 py-3 font-semibold">
			Download All as ZIP
		</button>
	</div>

	{/if}
</div>
