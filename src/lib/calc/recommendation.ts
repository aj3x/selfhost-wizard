import type { AssessmentState } from '$lib/types/assessment';
import type { BreakEvenResult } from './breakeven';

export type RecommendationTier =
	| 'stick_with_saas'
	| 'managed_nas'
	| 'diy_simple'
	| 'diy_full'
	| 'cloud_hosted';

export interface Recommendation {
	tier: RecommendationTier;
	title: string;
	summary: string;
	reasons: string[];
}

export function generateRecommendation(
	state: AssessmentState,
	monthlySaasCost: number,
	breakEven: BreakEvenResult
): Recommendation {
	const reasons: string[] = [];

	// Not enough SaaS spending to justify
	if (monthlySaasCost < 15) {
		reasons.push('Your current spending is quite low — savings would be minimal.');
		return {
			tier: 'stick_with_saas',
			title: 'Stick with Current Services',
			summary:
				"You're not spending enough on subscriptions to make self-hosting financially worthwhile right now. Consider revisiting if your costs grow.",
			reasons
		};
	}

	// Very time-constrained + beginner
	if (state.setupTimeBudget === 'hours' && state.skillLevel === 'beginner' && state.breakTolerance === 'low') {
		reasons.push("Limited time and low tolerance for troubleshooting.");
		reasons.push("A managed NAS gives you the benefits with less setup.");
		return {
			tier: 'managed_nas',
			title: 'Consider a Managed NAS',
			summary:
				'A pre-built NAS (Synology/Ugreen) gives you file sync, photo backup, and basic media serving with a polished UI and minimal setup.',
			reasons
		};
	}

	// Upload speed too low for sharing
	if (state.remoteAccess === 'share' && state.uploadSpeed < 10) {
		reasons.push('Your upload speed may limit sharing media with others remotely.');
	}

	// Break-even analysis
	if (breakEven.simpleMonths !== null && breakEven.simpleMonths <= 12) {
		reasons.push(`You could break even in ~${breakEven.simpleMonths} months.`);
	} else if (breakEven.simpleMonths !== null && breakEven.simpleMonths <= 24) {
		reasons.push(`Break-even in ~${breakEven.simpleMonths} months — reasonable payback period.`);
	} else if (breakEven.simpleMonths !== null) {
		reasons.push(
			`Break-even takes ~${breakEven.simpleMonths} months — consider if the privacy/control benefits are worth it.`
		);
	}

	// 5-year savings
	if (breakEven.fiveYearSavings > 500) {
		reasons.push(
			`Projected 5-year savings: $${Math.round(breakEven.fiveYearSavings)}.`
		);
	}

	// Determine scope
	const wantsMedia = state.wantsMedia;
	const wantsPhotos = state.wantsPhotoBackup;
	const wantsFiles = state.wantsFileSync;
	const featureCount = [wantsMedia, wantsPhotos, wantsFiles].filter(Boolean).length;

	if (featureCount >= 2 && (state.skillLevel === 'intermediate' || state.skillLevel === 'advanced')) {
		reasons.push('You want multiple services and have the skills to manage them.');
		return {
			tier: 'diy_full',
			title: 'Full DIY Self-Hosted Stack',
			summary:
				'Go all-in with Docker Compose — media server, photo backup, file sync, automation, and more. Use our configurator to generate your setup.',
			reasons
		};
	}

	if (featureCount >= 1) {
		if (state.skillLevel === 'beginner') {
			reasons.push('Starting with a focused setup keeps things manageable.');
			return {
				tier: 'managed_nas',
				title: 'Start with a Managed NAS',
				summary:
					"A Synology or similar NAS handles your needs with a friendly UI. You can always move to Docker later as you gain confidence.",
				reasons
			};
		}

		reasons.push('A focused Docker setup is a great starting point.');
		return {
			tier: 'diy_simple',
			title: 'Simple Docker Setup',
			summary:
				'A lightweight Docker Compose stack focused on what you need most. Our configurator will generate everything for you.',
			reasons
		};
	}

	// Fallback
	return {
		tier: 'stick_with_saas',
		title: 'Self-Hosting May Not Be For You (Yet)',
		summary:
			"Based on your answers, you don't have strong needs that self-hosting would address. Check back when your needs or spending change.",
		reasons: ["You haven't selected media, photos, or file sync needs."]
	};
}
