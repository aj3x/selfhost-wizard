<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-(--color-surface) text-(--color-text)">
	{@render children()}
</div>
