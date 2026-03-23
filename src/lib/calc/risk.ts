import type { AssessmentState } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';

export interface RiskAnalysis {
	totalDrives: number;
	annualFailureProbability: number;
	fiveYearFailureProbability: number;
	expectedReplacementsPerYear: number;
	annualizedReplacementCost: number;
	riskLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export function analyzeRisk(
	state: AssessmentState,
	defaults: CalculationDefaults,
	neededStorageGB: number
): RiskAnalysis {
	const existingDrives = state.byod.existingDrives;
	const existingGB = existingDrives.reduce((sum, d) => sum + d.sizeGB, 0);
	const additionalGB = Math.max(0, neededStorageGB - existingGB);
	const additionalDrives = additionalGB > 0 ? Math.ceil(additionalGB / 8000) : 0; // assume 8TB drives

	const totalDrives = existingDrives.length + additionalDrives;
	if (totalDrives === 0) {
		return {
			totalDrives: 0,
			annualFailureProbability: 0,
			fiveYearFailureProbability: 0,
			expectedReplacementsPerYear: 0,
			annualizedReplacementCost: 0,
			riskLevel: 'low'
		};
	}

	// Calculate weighted AFR
	let weightedAfr = 0;
	for (const drive of existingDrives) {
		const baseAfr =
			drive.type === 'ssd'
				? defaults.ssdAfr
				: drive.isNASRated
					? defaults.nasDriveAfr
					: defaults.hddAfr;
		// Older drives have higher failure rates
		const ageFactor = drive.ageYears > defaults.driveLifespanYears ? 2 : 1;
		weightedAfr += baseAfr * ageFactor;
	}
	// New drives at base rate
	weightedAfr += additionalDrives * defaults.hddAfr;
	const avgAfr = weightedAfr / totalDrives;

	// Probability of ANY failure
	const annualFailureProbability = 1 - Math.pow(1 - avgAfr, totalDrives);
	const fiveYearFailureProbability = 1 - Math.pow(1 - annualFailureProbability, 5);

	// Expected replacements
	const expectedReplacementsPerYear = totalDrives * avgAfr;

	// Replacement cost (accounting for warranty)
	const costPerDrive = defaults.hddPricePerTB * 8; // assume 8TB replacement
	let annualizedReplacementCost = 0;
	for (const drive of existingDrives) {
		const warrantyYears = drive.isNASRated
			? defaults.nasWarrantyYears
			: defaults.consumerWarrantyYears;
		const afr =
			drive.type === 'ssd'
				? defaults.ssdAfr
				: drive.isNASRated
					? defaults.nasDriveAfr
					: defaults.hddAfr;
		if (drive.ageYears >= warrantyYears) {
			annualizedReplacementCost += afr * costPerDrive;
		}
		// Under warranty: $0 replacement
	}
	annualizedReplacementCost += additionalDrives * defaults.hddAfr * costPerDrive;

	// Risk level
	let riskLevel: RiskAnalysis['riskLevel'];
	if (annualFailureProbability < 0.05) riskLevel = 'low';
	else if (annualFailureProbability < 0.1) riskLevel = 'medium';
	else if (annualFailureProbability < 0.2) riskLevel = 'high';
	else riskLevel = 'very_high';

	return {
		totalDrives,
		annualFailureProbability,
		fiveYearFailureProbability,
		expectedReplacementsPerYear,
		annualizedReplacementCost,
		riskLevel
	};
}
