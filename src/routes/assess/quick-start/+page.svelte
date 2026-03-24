<script lang="ts">
	let expanded = $state(true);
</script>

<svelte:head>
	<title>Quick Start Guidance — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Before We Start</h1>
	<p class="mb-6 text-(--color-text-muted)">
		Some quick advice that could save you a lot of time and money.
	</p>

	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="mb-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface-alt) p-4 text-left transition-colors hover:border-(--color-primary)/50"
	>
		<span class="text-lg font-semibold">I can save you a lot of time and effort</span>
		<span class="text-(--color-text-muted) transition-transform" class:rotate-180={expanded}>
			&#9660;
		</span>
	</button>

	{#if expanded}
		<div class="mb-8 space-y-6 rounded-xl border border-(--color-border) p-6">
			<!-- Hardware advice -->
			<div>
				<h3 class="mb-2 font-semibold">The best first server is a computer you already have.</h3>
				<div class="space-y-3 text-sm text-(--color-text-muted)">
					<p>
						<strong>Looking to host a game server?</strong> Use an old desktop. Put the server on a
						schedule to shut down during off-hours, or just power it up when you need it. You can
						always upgrade later.
					</p>
					<p>
						<strong>Want to try out small always-on services?</strong> Use an old laptop. It comes
						with its own display, keyboard, mouse, and built-in UPS (the battery). It also sips
						power.
					</p>
					<div class="rounded-lg bg-(--color-primary)/5 p-3 text-xs italic">
						I can't recommend this enough. Most of what I was doing ran off my old overheating
						laptop. I never needed to plug in a keyboard and monitor, and if the power went out I
						never worried.
					</div>
					<p>
						<strong>Want file storage with no effort?</strong> Consider a
						<strong>Synology or Ugreen NAS</strong>. Great for people who don't want to maintain or
						configure anything.
					</p>
					<p>
						<strong>Working off this server?</strong> Get Direct Attached Storage (DAS) or faster LAN
						with SSDs. A DAS is not a backup unless you specifically use it as one.
					</p>
				</div>
			</div>

			<!-- Storage advice -->
			<div>
				<h3 class="mb-2 font-semibold">For storage: estimate what you need, then buy a size up.</h3>
				<p class="text-sm text-(--color-text-muted)">
					I bought 4x4TB with 1 redundant drive. Hit 9 TB after 4 years with careful data limiting.
					Without that, I would have hit the limit much earlier from backups, photos, and
					movies/TV shows.
				</p>
			</div>

			<!-- OS recommendation -->
			<div>
				<h3 class="mb-2 font-semibold">Recommended OS by priority:</h3>
				<ol class="ml-4 list-decimal space-y-1 text-sm text-(--color-text-muted)">
					<li><strong>Developing IT skills:</strong> Ubuntu Server</li>
					<li><strong>Unfamiliar, want GUI fallback:</strong> Ubuntu Desktop</li>
					<li><strong>Don't want to learn anything new:</strong> Windows</li>
					<li><strong>Skilled IT:</strong> You don't need me ;)</li>
				</ol>
				<p class="mt-2 text-xs text-(--color-text-muted)">
					Feel free to look into other Linux distros — this recommendation is primarily based on the
					amount of community support available.
				</p>
			</div>

			<!-- Quick rule of thumb -->
			<div class="rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-4">
				<p class="text-sm font-medium">
					If you're storing 10 TB or more, self-storage is almost certainly cheaper than cloud.
				</p>
			</div>
		</div>
	{/if}

	<!-- CTAs -->
	<div class="flex flex-col gap-3 sm:flex-row">
		<a
			href="/assess/about-you"
			class="flex-1 rounded-xl bg-(--color-primary) px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-(--color-primary-hover)"
		>
			Continue to Full Assessment &rarr;
		</a>
		<a
			href="/configure"
			class="flex-1 rounded-xl border-2 border-(--color-border) px-6 py-4 text-center text-lg font-semibold transition-colors hover:border-(--color-primary)/50"
		>
			I already know what I want &rarr;
		</a>
	</div>

	<p class="mt-4 text-center text-sm text-(--color-text-muted)">
		The assessment takes about 5 minutes and gives you a personalized cost/benefit analysis.
	</p>
</div>
