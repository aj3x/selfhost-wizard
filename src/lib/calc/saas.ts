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

/** Calculate monthly self-hosted operating cost */
export function calcMonthlySelfHostedCost(
	state: AssessmentState,
	electricityCost: number,
	defaults: CalculationDefaults
): number {
	let total = electricityCost;

	// VPN for torrenting (Mullvad or similar)
	if (state.wantsMedia && state.automationLevel !== 'manual') {
		// Need a VPN if they don't already have one
		if (!state.vpnService?.enabled) {
			total += defaults.vpnMonthlyDefault;
		}
	}

	// Domain cost (annualized)
	if (state.wantsDomain) {
		total += defaults.domainAnnualCost / 12;
	}

	// Off-site backup
	if (state.wantsOffsiteBackup === 'cloud') {
		// Rough estimate: critical data only (photos + files, not media)
		let backupGB = 0;
		if (state.photoBackupIntent !== 'no') backupGB += state.existingPhotoLibraryGB;
		if (state.wantsFileSync) backupGB += state.computers.reduce((sum, c) => sum + c.sizeGB, 0);
		const backupTB = Math.max(0.1, backupGB / 1000); // minimum 0.1 TB
		total += backupTB * defaults.offsiteCostPerTbMonth;
	}

	return total;
}
