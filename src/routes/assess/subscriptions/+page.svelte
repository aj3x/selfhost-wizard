<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import { CURRENCY_SYMBOLS, VPN_SERVICES } from '$lib/types/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import ServiceToggle from '$lib/components/wizard/ServiceToggle.svelte';

	let currency = $derived($assessment.currency);
	let symbol = $derived(CURRENCY_SYMBOLS[currency]);

	let totalMonthly = $derived(
		[
			...$assessment.streamingServices.filter((s) => s.enabled),
			...$assessment.musicServices.filter((s) => s.enabled),
			...$assessment.cloudStorage.filter((s) => s.enabled),
			...$assessment.photoBackupServices.filter((s) => s.enabled),
			...($assessment.vpnService && $assessment.vpnService.enabled ? [$assessment.vpnService] : [])
		].reduce((sum, s) => sum + s.monthlyCost, 0) +
			$assessment.otherServices.reduce((sum, s) => sum + s.monthlyCost, 0)
	);

	function toggleVPN(id: string) {
		const svc = VPN_SERVICES.find((s) => s.id === id);
		if (!svc) return;
		if ($assessment.vpnService?.id === id) {
			$assessment.vpnService = { ...$assessment.vpnService, enabled: !$assessment.vpnService.enabled };
		} else {
			$assessment.vpnService = { ...svc, enabled: true };
		}
	}

	function addOtherService() {
		$assessment.otherServices = [
			...$assessment.otherServices,
			{ name: '', monthlyCost: 0, category: 'other' }
		];
	}

	function removeOtherService(index: number) {
		$assessment.otherServices = $assessment.otherServices.filter((_, i) => i !== index);
	}
</script>

<h1 class="mb-2 text-2xl font-bold">Current Subscriptions</h1>
<p class="mb-8 text-(--color-text-muted)">
	What are you paying for today? This helps us calculate potential savings.
</p>

<!-- Floating total -->
<div class="sticky top-4 z-10 mb-6 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/5 p-3 text-center">
	<span class="text-sm text-(--color-text-muted)">Current monthly spending:</span>
	<span class="ml-2 text-xl font-bold text-(--color-primary)">
		{symbol}{totalMonthly.toFixed(2)}/mo
	</span>
	<span class="ml-1 text-sm text-(--color-text-muted)">
		({symbol}{(totalMonthly * 12).toFixed(0)}/yr)
	</span>
</div>

<QuestionGroup label="Streaming Video">
	<div class="flex flex-col gap-2">
		{#each $assessment.streamingServices as service, i}
			<ServiceToggle
				name={service.name}
				bind:monthlyCost={$assessment.streamingServices[i].monthlyCost}
				bind:enabled={$assessment.streamingServices[i].enabled}
				{currency}
			/>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="Music">
	<div class="flex flex-col gap-2">
		{#each $assessment.musicServices as service, i}
			<ServiceToggle
				name={service.name}
				bind:monthlyCost={$assessment.musicServices[i].monthlyCost}
				bind:enabled={$assessment.musicServices[i].enabled}
				{currency}
			/>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="Cloud Storage">
	<div class="flex flex-col gap-2">
		{#each $assessment.cloudStorage as service, i}
			<ServiceToggle
				name={service.name}
				bind:monthlyCost={$assessment.cloudStorage[i].monthlyCost}
				bind:enabled={$assessment.cloudStorage[i].enabled}
				{currency}
			/>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="Photo Backup">
	<div class="flex flex-col gap-2">
		{#each $assessment.photoBackupServices as service, i}
			<ServiceToggle
				name={service.name}
				bind:monthlyCost={$assessment.photoBackupServices[i].monthlyCost}
				bind:enabled={$assessment.photoBackupServices[i].enabled}
				{currency}
			/>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="VPN Service">
	<div class="flex flex-col gap-2">
		{#each VPN_SERVICES as svc}
			<ServiceToggle
				name={svc.name}
				monthlyCost={$assessment.vpnService?.id === svc.id ? $assessment.vpnService.monthlyCost : svc.monthlyCost}
				enabled={$assessment.vpnService?.id === svc.id && $assessment.vpnService.enabled}
				{currency}
				editable={false}
				ontoggle={() => toggleVPN(svc.id)}
			/>
		{/each}
	</div>
</QuestionGroup>

<QuestionGroup label="Other Services" description="Password managers, note-taking, recipes, automation, etc.">
	<div class="flex flex-col gap-2">
		{#each $assessment.otherServices as service, i}
			<div class="flex items-center gap-3 rounded-lg border border-(--color-border) p-3">
				<input
					type="text"
					bind:value={$assessment.otherServices[i].name}
					placeholder="Service name"
					class="h-8 flex-1 rounded border border-(--color-border) bg-(--color-surface) px-3 text-sm"
				/>
				<div class="relative flex items-center">
					<span class="absolute left-2 text-xs text-(--color-text-muted)">{symbol}</span>
					<input
						type="number"
						min="0"
						step="0.01"
						bind:value={$assessment.otherServices[i].monthlyCost}
						class="h-8 w-20 rounded border border-(--color-border) bg-(--color-surface) pl-6 pr-1 text-right text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					/>
					<span class="ml-1 text-xs text-(--color-text-muted)">/mo</span>
				</div>
				<button
					type="button"
					onclick={() => removeOtherService(i)}
					class="cursor-pointer text-sm text-(--color-danger) hover:underline"
				>
					Remove
				</button>
			</div>
		{/each}
		<button
			type="button"
			onclick={addOtherService}
			class="mt-2 cursor-pointer rounded-lg border border-dashed border-(--color-border) px-4 py-2 text-sm text-(--color-text-muted) transition-colors hover:border-(--color-primary) hover:text-(--color-primary)"
		>
			+ Add service
		</button>
	</div>
</QuestionGroup>
