<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
	import Alert from '$lib/components/shared/Alert.svelte';
	import RecommendedBadge from '$lib/components/shared/RecommendedBadge.svelte';

	let skill = $derived($assessment.skillLevel);
	let isBeginner = $derived(skill === 'beginner');

	let isNon247 = $derived($assessment.uptimeSchedule.preset !== '24_7');

	// Check if user needs always-on for certain features
	let needsAlwaysOn = $derived(
		$assessment.photoBackupIntent !== 'no' ||
		$assessment.automationLevel !== 'manual' ||
		$assessment.remoteAccess !== 'none'
	);
</script>

<h1 class="mb-2 text-2xl font-bold">Time & Maintenance</h1>
<p class="mb-8 text-(--color-text-muted)">
	Be honest about your time budget — this is the biggest factor in whether self-hosting is right for you.
</p>

{#if isBeginner}
	<Alert type="beginner">
		Self-hosting is like having a pet — it needs some care and attention. The more you're willing to invest
		upfront, the more you'll get out of it. But even minimal setups can save you money.
	</Alert>
{/if}

<QuestionGroup label="How much time can you spend on initial setup?">
	<SingleSelect
		options={[
			{
				value: 'hours',
				label: 'A few hours',
				description: isBeginner ? "I want it working today — keep it simple" : 'Quick and simple — minimal setup'
			},
			{
				value: 'weekend',
				label: 'A weekend',
				description: isBeginner ? "I can dedicate a Saturday to this" : 'Enough for a solid media/photo stack'
			},
			{
				value: 'take_time',
				label: 'Take my time',
				description: isBeginner ? "I'm happy to learn over a few weeks" : 'Learn as I go over a few weeks'
			},
			{
				value: 'unlimited',
				label: 'As long as it takes',
				description: 'I enjoy the process of building and learning'
			}
		]}
		bind:value={$assessment.setupTimeBudget}
		columns={2}
	/>
	{#if isBeginner && $assessment.setupTimeBudget === 'hours'}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			With just a few hours, a pre-built NAS (like Synology or Ugreen) might be your best bet — minimal setup, works out of the box.
		</p>
	{/if}
</QuestionGroup>

<QuestionGroup label="How much ongoing maintenance are you willing to do?">
	<SingleSelect
		options={[
			{
				value: 'minimal',
				label: 'Minimal',
				description: isBeginner ? 'Set it and forget it — maybe glance at it once a month' : 'Auto-updates only, check monthly'
			},
			{
				value: 'some',
				label: 'Some',
				description: isBeginner ? "I'm okay spending 30 minutes a week on it" : '~30 min/week checking and updating'
			},
			{
				value: 'regular',
				label: 'Regular',
				description: 'I enjoy tinkering and optimizing'
			}
		]}
		bind:value={$assessment.maintenanceBudget}
		columns={3}
	/>
</QuestionGroup>

<QuestionGroup label="How do you feel about things breaking?">
	<SingleSelect
		options={[
			{
				value: 'low',
				label: 'Low tolerance',
				description: isBeginner ? "If something breaks I won't know what to do" : "If it breaks I'll panic"
			},
			{
				value: 'medium',
				label: 'Medium',
				description: 'I can troubleshoot with guides and forums'
			},
			{
				value: 'high',
				label: 'High tolerance',
				description: "I expect things to break sometimes — it's part of learning"
			}
		]}
		bind:value={$assessment.breakTolerance}
		columns={3}
	/>
	{#if isBeginner && $assessment.breakTolerance === 'low'}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			We'll recommend the most stable, well-documented options with the largest communities for help.
		</p>
	{/if}
</QuestionGroup>

<QuestionGroup label="Do you have someone who can help?">
	<SingleSelect
		options={[
			{
				value: 'yes',
				label: 'Tech-savvy friend/family',
				description: 'Someone who can help when I get stuck'
			},
			{
				value: 'ai',
				label: 'AI tools',
				description: "I'll use ChatGPT or Claude to help me troubleshoot"
			},
			{
				value: 'no',
				label: 'On my own',
				description: 'Just me and documentation'
			}
		]}
		bind:value={$assessment.helpAvailable}
		columns={3}
	/>
	{#if $assessment.helpAvailable === 'no'}
		<p class="mt-2 text-sm text-(--color-text-muted)">
			Communities like r/selfhosted, the Selfhosted podcast Discord, and various project-specific forums are excellent resources.
		</p>
	{/if}
</QuestionGroup>

<QuestionGroup label="How often will your server be running?">
	<SingleSelect
		options={[
			{
				value: '24_7',
				label: '24/7 (always on)',
				description: isBeginner ? 'Required for remote access, auto-downloads, and photo backup' : 'Default for NAS, media, photo backup'
			},
			{
				value: 'daytime',
				label: 'Daytime (~16 hrs)',
				description: 'Server sleeps overnight — saves ~33% on electricity'
			},
			{
				value: 'evenings_weekends',
				label: 'Evenings & weekends',
				description: '~8 hrs/day — saves ~67% on electricity'
			},
			{
				value: 'weekends',
				label: 'Weekends only',
				description: 'Hobby or game server use'
			},
			{
				value: 'on_demand',
				label: 'On demand',
				description: 'Power on when I need it'
			},
			{
				value: 'custom',
				label: 'Custom',
				description: 'Set your own schedule'
			}
		]}
		bind:value={$assessment.uptimeSchedule.preset}
		columns={2}
	/>
</QuestionGroup>

{#if isNon247 && needsAlwaysOn}
	<Alert type="warning">
		Some of your selections work best with the server always on:
		{#if $assessment.photoBackupIntent !== 'no'}
			<strong>Photo auto-backup</strong> only syncs when the server is running.
		{/if}
		{#if $assessment.automationLevel !== 'manual'}
			<strong>Automated downloads</strong> (Sonarr/Radarr) need the server on to monitor and grab new content.
		{/if}
		{#if $assessment.remoteAccess !== 'none'}
			<strong>Remote access</strong> won't work when the server is off.
		{/if}
		Consider 24/7, or accept that these features won't work while the server is sleeping.
	</Alert>
{/if}

<ConditionalSection visible={$assessment.uptimeSchedule.preset === 'custom'}>
	<QuestionGroup label="Custom schedule">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="customHours" class="mb-1 block text-sm text-(--color-text-muted)">Hours per day</label>
				<NumberInput
					id="customHours"
					value={$assessment.uptimeSchedule.customHoursPerDay ?? 12}
					onchange={(v) => ($assessment.uptimeSchedule.customHoursPerDay = v)}
					min={1}
					max={24}
					suffix="hrs"
				/>
			</div>
			<div>
				<label for="customDays" class="mb-1 block text-sm text-(--color-text-muted)">Days per month</label>
				<NumberInput
					id="customDays"
					value={$assessment.uptimeSchedule.customDaysPerMonth ?? 20}
					onchange={(v) => ($assessment.uptimeSchedule.customDaysPerMonth = v)}
					min={1}
					max={31}
					suffix="days"
				/>
			</div>
		</div>
	</QuestionGroup>
</ConditionalSection>
