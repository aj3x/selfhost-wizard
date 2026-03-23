<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		visible: boolean;
		children: Snippet;
	}

	let { visible, children }: Props = $props();
</script>

{#if visible}
	<div class="animate-fadeIn">
		{@render children()}
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}
</style>
