<svelte:head>
	<title>Self-Hosting Tools — SelfHost Wizard</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-2 text-2xl font-bold">Standalone Tools</h1>
	<p class="mb-8 text-(--color-text-muted)">
		Quick calculators you can use without going through the full assessment.
	</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<a href="/tools/subscription-calc" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Subscription Calculator</h2>
			<p class="text-sm text-(--color-text-muted)">Add up what you're spending on cloud services each month.</p>
		</a>

		<a href="/tools/storage-estimator" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Storage Estimator</h2>
			<p class="text-sm text-(--color-text-muted)">Estimate how much disk space you'll need for media, photos, and files.</p>
		</a>

		<a href="/tools/electricity-calc" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Electricity Calculator</h2>
			<p class="text-sm text-(--color-text-muted)">Find out how much it costs to run a server 24/7 at your electricity rate.</p>
		</a>

		<a href="/tools/break-even" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Break-Even Calculator</h2>
			<p class="text-sm text-(--color-text-muted)">See when self-hosting pays for itself vs. staying with cloud services.</p>
		</a>

		<a href="/tools/drive-risk" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Drive Failure Calculator</h2>
			<p class="text-sm text-(--color-text-muted)">Estimate the probability of hard drive failure and replacement costs.</p>
		</a>

		<a href="/tools/photo-estimator" class="group rounded-xl border border-(--color-border) p-5 transition-colors hover:border-(--color-primary)/50 hover:bg-(--color-primary)/5">
			<h2 class="mb-1 font-semibold group-hover:text-(--color-primary)">Photo Library Estimator</h2>
			<p class="text-sm text-(--color-text-muted)">Estimate storage needs based on your devices and shooting habits.</p>
		</a>
	</div>

	<div class="mt-8 text-center">
		<a href="/assess/quick-start" class="text-sm text-(--color-primary) hover:underline">
			Want the full picture? Start the assessment &rarr;
		</a>
	</div>
</div>
