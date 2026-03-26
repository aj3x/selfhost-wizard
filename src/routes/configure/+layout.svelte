<script lang="ts">
	import ConfiguratorShell from '$lib/components/configurator/ConfiguratorShell.svelte';

	let { children } = $props();
</script>

<ConfiguratorShell>
	{@render children()}
</ConfiguratorShell>
