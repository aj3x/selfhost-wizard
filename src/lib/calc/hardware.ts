import type { AssessmentState } from '$lib/types/assessment';
import type { CalculationDefaults } from '$lib/types/defaults';
import type { StorageBreakdown } from './storage';

export interface HardwareCostBreakdown {
	device: number;
	storage: number;
	accessories: number;
	total: number;
	deviceLabel: string;
}

/** Estimate the number of drives and cost for needed storage */
function storageCost(neededGB: number, existingGB: number, defaults: CalculationDefaults): number {
	const additionalGB = Math.max(0, neededGB - existingGB);
	if (additionalGB <= 0) return 0;
	const additionalTB = additionalGB / 1000;
	return Math.ceil(additionalTB) * defaults.hddPricePerTB * 1000 / 1000; // price per TB
	// Simplify: just price per TB * TB needed (rounded up to whole drives)
}

export function estimateHardwareCost(
	state: AssessmentState,
	defaults: CalculationDefaults,
	storage: StorageBreakdown
): HardwareCostBreakdown {
	let device = 0;
	let deviceLabel = '';

	const existingStorageGB = state.byod.existingDrives.reduce((sum, d) => sum + d.sizeGB, 0);

	// Device cost
	if (state.byod.machineType === 'none') {
		// Recommend based on complexity
		const needsTranscoding = state.needsTranscoding && state.concurrentStreams >= 3;
		const wantsML = state.mlPreference === 'full';
		const totalStorageTB = storage.withHeadroomGB / 1000;

		if (totalStorageTB > 20 || needsTranscoding) {
			device = 700;
			deviceLabel = 'Custom Build (i5 + case)';
		} else if (wantsML || totalStorageTB > 8) {
			device = 400;
			deviceLabel = 'Mini PC (N305)';
		} else if (state.skillLevel === 'beginner' && totalStorageTB <= 8) {
			device = 350;
			deviceLabel = 'Pre-built NAS (2-bay)';
		} else {
			device = 200;
			deviceLabel = 'Mini PC (N100)';
		}
	} else {
		deviceLabel = 'Using existing hardware';
	}

	// Storage cost
	const additionalGB = Math.max(0, storage.withHeadroomGB - existingStorageGB);
	const additionalTB = additionalGB / 1000;
	const storageCostTotal = Math.ceil(additionalTB) * defaults.hddPricePerTB;

	// Accessories
	let accessories = 0;
	if (state.wantsUPS && !state.byod.hasUPS) accessories += 80;
	if (state.wantsDomain) accessories += defaults.domainAnnualCost; // first year

	return {
		device,
		storage: storageCostTotal,
		accessories,
		total: device + storageCostTotal + accessories,
		deviceLabel
	};
}
