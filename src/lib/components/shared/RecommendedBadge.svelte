<script lang="ts">
	interface Props {
		show?: boolean;
	}

	let { show = true }: Props = $props();
</script>

{#if show}
	<span class="ml-2 inline-block rounded-full bg-(--color-primary)/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-primary)">
		Recommended
	</span>
{/if}
