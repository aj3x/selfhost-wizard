import type { CalculationDefaults } from '$lib/types/defaults';

export interface BreakEvenResult {
	simpleMonths: number | null; // null if never breaks even
	riskAdjustedMonths: number | null;
	fiveYearSaasCost: number;
	fiveYearSelfHostedCost: number;
	fiveYearSavings: number;
	cumulativeCosts: { month: number; saas: number; selfHosted: number }[];
}

export function calcBreakEven(
	monthlySaasCost: number,
	monthlySelfHostedCost: number,
	upfrontCost: number,
	annualDriveReplacementCost: number,
	defaults: CalculationDefaults
): BreakEvenResult {
	const monthlySavings = monthlySaasCost - monthlySelfHostedCost;

	// Simple break-even
	const simpleMonths = monthlySavings > 0 ? Math.ceil(upfrontCost / monthlySavings) : null;

	// Risk-adjusted (includes drive replacement)
	const monthlyDriveReplacement = annualDriveReplacementCost / 12;
	const adjustedMonthlySavings = monthlySavings - monthlyDriveReplacement;
	const riskAdjustedMonths =
		adjustedMonthlySavings > 0 ? Math.ceil(upfrontCost / adjustedMonthlySavings) : null;

	// 5-year TCO with cumulative data for charting
	const months = defaults.tcoProjectionYears * 12;
	const cumulativeCosts: BreakEvenResult['cumulativeCosts'] = [];
	let saasCumulative = 0;
	let selfHostedCumulative = upfrontCost;

	for (let m = 0; m <= months; m++) {
		const inflatedSaasCost = monthlySaasCost * Math.pow(1 + defaults.saasPriceInflationAnnual, m / 12);
		cumulativeCosts.push({
			month: m,
			saas: Math.round(saasCumulative),
			selfHosted: Math.round(selfHostedCumulative)
		});
		saasCumulative += inflatedSaasCost;
		selfHostedCumulative += monthlySelfHostedCost + monthlyDriveReplacement;
	}

	const fiveYearSaasCost = cumulativeCosts[months].saas;
	const fiveYearSelfHostedCost = cumulativeCosts[months].selfHosted;

	return {
		simpleMonths,
		riskAdjustedMonths,
		fiveYearSaasCost,
		fiveYearSelfHostedCost,
		fiveYearSavings: fiveYearSaasCost - fiveYearSelfHostedCost,
		cumulativeCosts
	};
}
