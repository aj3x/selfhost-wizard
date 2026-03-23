<script lang="ts">
	import { assessment } from '$lib/stores/assessment';
	import QuestionGroup from '$lib/components/wizard/QuestionGroup.svelte';
	import SingleSelect from '$lib/components/wizard/SingleSelect.svelte';
	import NumberInput from '$lib/components/wizard/NumberInput.svelte';
	import ConditionalSection from '$lib/components/wizard/ConditionalSection.svelte';
</script>

<h1 class="mb-2 text-2xl font-bold">Time & Maintenance</h1>
<p class="mb-8 text-(--color-text-muted)">
	Be honest about your time budget — this is the #1 factor that determines if self-hosting is right
	for you.
</p>

<QuestionGroup label="How much time can you spend on initial setup?">
	<SingleSelect
		options={[
			{ value: 'hours', label: 'A few hours', description: 'Quick and simple — we\'ll keep it minimal' },
			{ value: 'weekend', label: 'A weekend', description: 'Enough for a solid media/photo stack' },
			{ value: 'take_time', label: 'Take my time', description: 'Over a few weeks, no rush' },
			{ value: 'unlimited', label: 'As long as it takes', description: 'I enjoy the process' }
		]}
		bind:value={$assessment.setupTimeBudget}
		columns={2}
	/>
</QuestionGroup>

<QuestionGroup label="Ongoing maintenance willingness">
	<SingleSelect
		options={[
			{ value: 'minimal', label: 'Minimal', description: 'Set it and forget it — auto-updates only' },
			{ value: 'some', label: 'Some', description: '30 min/week checking on things' },
			{ value: 'regular', label: 'Regular', description: 'I enjoy tinkering and optimizing' }
		]}
		bind:value={$assessment.maintenanceBudget}
		columns={3}
	/>
</QuestionGroup>

<QuestionGroup label="Comfort with things breaking">
	<SingleSelect
		options={[
			{ value: 'low', label: 'Low', description: "If it breaks, I'll panic" },
			{ value: 'medium', label: 'Medium', description: "I can troubleshoot with guides" },
			{ value: 'high', label: 'High', description: 'I enjoy debugging — it\'s half the fun' }
		]}
		bind:value={$assessment.breakTolerance}
		columns={3}
	/>
</QuestionGroup>

<QuestionGroup label="Help available">
	<SingleSelect
		options={[
			{ value: 'yes', label: 'Tech-savvy person', description: 'Friend or family member who can help' },
			{ value: 'ai', label: 'AI tools', description: "I'll use ChatGPT/Claude when stuck" },
			{ value: 'no', label: 'On my own', description: 'Just me and documentation' }
		]}
		bind:value={$assessment.helpAvailable}
		columns={3}
	/>
</QuestionGroup>

<QuestionGroup label="Server uptime schedule">
	<SingleSelect
		options={[
			{ value: '24_7', label: '24/7', description: 'Always on — required for remote access & automation' },
			{ value: 'daytime', label: 'Daytime (16 hrs)', description: 'On during waking hours' },
			{ value: 'evenings_weekends', label: 'Evenings & weekends', description: '~8 hrs/day' },
			{ value: 'weekends', label: 'Weekends only', description: '~8.7 days/month' },
			{ value: 'on_demand', label: 'On demand', description: 'Turn on when needed' },
			{ value: 'custom', label: 'Custom', description: 'Set your own schedule' }
		]}
		bind:value={$assessment.uptimeSchedule.preset}
		columns={2}
	/>
</QuestionGroup>

<ConditionalSection visible={$assessment.uptimeSchedule.preset === 'custom'}>
	<QuestionGroup label="Custom schedule">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="mb-1 block text-sm text-(--color-text-muted)">Hours per day</label>
				<NumberInput
					value={$assessment.uptimeSchedule.customHoursPerDay ?? 12}
					onchange={(v) => ($assessment.uptimeSchedule.customHoursPerDay = v)}
					min={1}
					max={24}
					suffix="hrs"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-(--color-text-muted)">Days per month</label>
				<NumberInput
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
