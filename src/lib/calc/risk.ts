import type { AssessmentState, ExistingDrive } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';

export interface RiskAnalysis {
	totalDrives: number;
	annualFailureProbability: number;
	fiveYearFailureProbability: number;
	expectedReplacementsPerYear: number;
	annualizedReplacementCost: number;
	riskLevel: 'low' | 'medium' | 'high' | 'very_high';
}

/** Annual failure rate for a drive, doubled once it's past its expected lifespan */
function driveAfr(drive: ExistingDrive, defaults: CalculationDefaults): number {
	const baseAfr =
		drive.type === 'ssd'
			? defaults.ssdAfr
			: drive.isNASRated
				? defaults.nasDriveAfr
				: defaults.hddAfr;
	return drive.ageYears > defaults.driveLifespanYears ? baseAfr * 2 : baseAfr;
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

	// Each drive fails independently at its own rate
	const driveAfrs = [
		...existingDrives.map((d) => driveAfr(d, defaults)),
		...Array<number>(additionalDrives).fill(defaults.hddAfr)
	];

	// Probability of ANY failure
	const annualFailureProbability = 1 - driveAfrs.reduce((p, afr) => p * (1 - afr), 1);
	const fiveYearFailureProbability = 1 - Math.pow(1 - annualFailureProbability, 5);

	// Expected replacements
	const expectedReplacementsPerYear = driveAfrs.reduce((sum, afr) => sum + afr, 0);

	// Replacement cost (accounting for warranty)
	const costPerDrive = defaults.hddPricePerTB * 8; // assume 8TB replacement
	let annualizedReplacementCost = 0;
	for (const drive of existingDrives) {
		const warrantyYears = drive.isNASRated
			? defaults.nasWarrantyYears
			: defaults.consumerWarrantyYears;
		if (drive.ageYears >= warrantyYears) {
			annualizedReplacementCost += driveAfr(drive, defaults) * costPerDrive;
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
