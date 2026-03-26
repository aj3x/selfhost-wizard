<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	let isHome = $derived(page.url.pathname === '/');
</script>

<div class="min-h-screen bg-(--color-surface) text-(--color-text)">
	{#if !isHome}
		<nav class="border-b border-(--color-border) bg-(--color-surface)">
			<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
				<a href="/" class="text-sm font-semibold text-(--color-primary) hover:underline">SelfHost Wizard</a>
				<div class="flex items-center gap-4 text-xs">
					<a href="/assess/quick-start" class="text-(--color-text-muted) hover:text-(--color-text)">Assessment</a>
					<a href="/configure" class="text-(--color-text-muted) hover:text-(--color-text)">Configurator</a>
					<a href="/tools" class="text-(--color-text-muted) hover:text-(--color-text)">Tools</a>
					<a href="/settings" class="text-(--color-text-muted) hover:text-(--color-text)">Settings</a>
				</div>
			</div>
		</nav>
	{/if}
	{@render children()}
</div>
