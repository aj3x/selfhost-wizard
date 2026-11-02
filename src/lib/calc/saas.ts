import type { AssessmentState } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';

/** Calculate total current monthly SaaS spending */
export function calcMonthlySaasCost(state: AssessmentState): number {
	let total = 0;
	total += state.streamingServices.filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyCost, 0);
	total += state.musicServices.filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyCost, 0);
	total += state.cloudStorage.filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyCost, 0);
	total += state.photoBackupServices.filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyCost, 0);
	if (state.vpnService?.enabled) total += state.vpnService.monthlyCost;
	total += state.otherServices.reduce((sum, s) => sum + s.monthlyCost, 0);
	return total;
}

export interface SelfHostedBreakdown {
	electricity: number;
	vpn: number;
	domain: number;
	offsite: number;
	total: number;
}

/** Calculate monthly self-hosted operating cost, itemized */
export function calcSelfHostedBreakdown(
	state: AssessmentState,
	electricityCost: number,
	defaults: CalculationDefaults
): SelfHostedBreakdown {
	// VPN for torrenting: an existing subscription keeps being paid, otherwise assume a new one
	let vpn = 0;
	if (state.wantsMedia && state.automationLevel !== 'manual') {
		vpn = state.vpnService?.enabled ? state.vpnService.monthlyCost : defaults.vpnMonthlyDefault;
	}

	// Domain cost (annualized)
	const domain = state.wantsDomain ? defaults.domainAnnualCost / 12 : 0;

	// Off-site backup
	let offsite = 0;
	if (state.wantsOffsiteBackup === 'cloud') {
		// Rough estimate: critical data only (photos + files, not media)
		let backupGB = 0;
		if (state.photoBackupIntent !== 'no') backupGB += state.existingPhotoLibraryGB;
		if (state.wantsFileSync) backupGB += state.computers.reduce((sum, c) => sum + c.sizeGB, 0);
		const backupTB = Math.max(0.1, backupGB / 1000); // minimum 0.1 TB
		offsite = backupTB * defaults.offsiteCostPerTbMonth;
	}

	return {
		electricity: electricityCost,
		vpn,
		domain,
		offsite,
		total: electricityCost + vpn + domain + offsite
	};
}
