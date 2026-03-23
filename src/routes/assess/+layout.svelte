<script lang="ts">
	import WizardShell from '$lib/components/layout/WizardShell.svelte';
	let { children } = $props();
</script>

<WizardShell>
	{@render children()}
</WizardShell>
