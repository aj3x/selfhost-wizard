<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'info' | 'warning' | 'tip' | 'beginner';
		children: Snippet;
	}

	let { type = 'info', children }: Props = $props();

	const styles = {
		info: 'border-(--color-primary)/30 bg-(--color-primary)/5',
		warning: 'border-(--color-warning)/30 bg-(--color-warning)/5',
		tip: 'border-(--color-success)/30 bg-(--color-success)/5',
		beginner: 'border-blue-300/30 bg-blue-50 dark:bg-blue-950/20'
	};

	const labels = {
		info: 'Info',
		warning: 'Note',
		tip: 'Tip',
		beginner: 'Beginner Tip'
	};
</script>

<div class="my-3 rounded-lg border p-3 text-sm {styles[type]}">
	<span class="font-medium">{labels[type]}:</span>
	{@render children()}
</div>
