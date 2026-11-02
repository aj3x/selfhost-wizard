<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>SelfHost Wizard — Should you self-host?</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
	<h1 class="mb-4 text-4xl font-bold sm:text-5xl">
		Should you <span class="text-(--color-primary)">self-host</span>?
	</h1>
	<p class="mb-8 max-w-xl text-lg text-(--color-text-muted)">
		Find out if running your own server for media, photos, and files makes financial and practical
		sense for you. Get a personalized cost analysis in 5 minutes.
	</p>

	<a
		href={resolve('/assess')}
		class="mb-12 inline-block rounded-xl bg-(--color-primary) px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-(--color-primary-hover)"
	>
		Start Assessment &rarr;
	</a>

	<div class="grid max-w-2xl gap-6 text-left sm:grid-cols-3">
		<div class="rounded-xl border border-(--color-border) p-5">
			<div class="mb-2 text-2xl">1</div>
			<h3 class="mb-1 font-semibold">Answer Questions</h3>
			<p class="text-sm text-(--color-text-muted)">
				Tell us about your subscriptions, media habits, and technical comfort level.
			</p>
		</div>
		<div class="rounded-xl border border-(--color-border) p-5">
			<div class="mb-2 text-2xl">2</div>
			<h3 class="mb-1 font-semibold">Get Your Analysis</h3>
			<p class="text-sm text-(--color-text-muted)">
				See a cost comparison, break-even timeline, hardware recommendations, and risk assessment.
			</p>
		</div>
		<div class="rounded-xl border border-(--color-border) p-5">
			<div class="mb-2 text-2xl">3</div>
			<h3 class="mb-1 font-semibold">Build Your Stack</h3>
			<p class="text-sm text-(--color-text-muted)">
				Generate a ready-to-deploy Docker Compose setup tailored to your needs.
			</p>
		</div>
	</div>

	<div class="mt-8 flex flex-col items-center gap-2">
		<a href={resolve('/configure')} class="text-sm text-(--color-primary) hover:underline">
			Already know what you want? Jump to the Configurator &rarr;
		</a>
		<a href={resolve('/tools')} class="text-sm text-(--color-text-muted) hover:underline">
			Just need a quick calculator? Try our standalone tools &rarr;
		</a>
	</div>

	<div class="mt-6 text-sm text-(--color-text-muted)">
		100% client-side. No accounts. No tracking. Your data stays in your browser.
	</div>
</div>
