import type { AssessmentState, UptimePreset } from '$lib/types/assessment';
import { UPTIME_HOURS, UPTIME_DAYS_PER_MONTH } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';

/** Estimate device wattage based on machine type and config */
export function estimateWattage(state: AssessmentState, defaults: CalculationDefaults): number {
	// User override
	if (state.byod.machineWattage) return state.byod.machineWattage;

	const driveCount = state.byod.existingDrives.length;

	switch (state.byod.machineType) {
		case 'nas':
			return driveCount <= 2 ? defaults.wattageNAS2Bay : defaults.wattageNAS4Bay;
		case 'mini_pc':
			return driveCount >= 2 ? defaults.wattageMiniPcN100_2HDD : defaults.wattageMiniPcN100;
		case 'desktop':
			return driveCount >= 6 ? defaults.wattageFullBuild8HDD : defaults.wattageFullBuild4HDD;
		case 'laptop':
			return 20;
		case 'enterprise':
			return 120;
		case 'none':
		default:
			// Will buy — estimate based on likely recommendation
			return defaults.wattageMiniPcN100_2HDD;
	}
}

/** Get uptime hours/day and days/month from schedule */
export function getUptimeParams(state: AssessmentState): { hoursPerDay: number; daysPerMonth: number } {
	const preset = state.uptimeSchedule.preset;
	if (preset === 'custom') {
		return {
			hoursPerDay: state.uptimeSchedule.customHoursPerDay ?? 12,
			daysPerMonth: state.uptimeSchedule.customDaysPerMonth ?? 20
		};
	}
	return {
		hoursPerDay: UPTIME_HOURS[preset],
		daysPerMonth: UPTIME_DAYS_PER_MONTH[preset]
	};
}

/** Monthly electricity cost */
export function calcElectricityCost(
	state: AssessmentState,
	defaults: CalculationDefaults
): number {
	const wattage = estimateWattage(state, defaults);
	const { hoursPerDay, daysPerMonth } = getUptimeParams(state);
	const kwhPerMonth = (wattage * hoursPerDay * daysPerMonth) / 1000;
	return kwhPerMonth * state.electricityRate;
}
