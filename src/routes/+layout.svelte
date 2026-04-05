<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	let isHome = $derived(page.url.pathname === '/');
	let currentPath = $derived(page.url.pathname);
</script>

<div class="min-h-screen bg-(--color-surface) text-(--color-text)">
	{#if !isHome}
		<nav class="border-b border-(--color-border) bg-(--color-surface)" aria-label="Main navigation">
			<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
				<a href="/" class="text-sm font-semibold text-(--color-primary) hover:underline">SelfHost Wizard</a>
				<ul class="flex items-center gap-4 text-xs" role="list">
					<li><a href="/assess/quick-start" aria-current={currentPath.startsWith('/assess') ? 'page' : undefined} class="text-(--color-text-muted) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-primary)">Assessment</a></li>
					<li><a href="/configure/service-select" aria-current={currentPath.startsWith('/configure') ? 'page' : undefined} class="text-(--color-text-muted) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-primary)">Configurator</a></li>
					<li><a href="/tools" aria-current={currentPath.startsWith('/tools') ? 'page' : undefined} class="text-(--color-text-muted) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-primary)">Tools</a></li>
					<li><a href="/settings" aria-current={currentPath === '/settings' ? 'page' : undefined} class="text-(--color-text-muted) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-primary)">Settings</a></li>
				</ul>
			</div>
		</nav>
	{/if}
	{@render children()}
</div>
