export interface CalculationDefaults {
	// Storage estimation – file sizes in GB
	movieSize720p: number;
	movieSize1080p: number;
	movieSize4k: number;
	movieSize4kHdr: number;
	episodeSize720p: number;
	episodeSize1080p: number;
	episodeSize4k: number;
	episodeSize4kHdr: number;
	avgEpisodesPerSeason: number;
	mediaGrowthRateAnnual: number;
	fileGrowthRateAnnual: number;
	growthProjectionYears: number;
	storageHeadroomMultiplier: number;
	systemOverheadGB: number;

	// Drive failure
	hddAfr: number;
	ssdAfr: number;
	nasDriveAfr: number;
	consumerWarrantyYears: number;
	nasWarrantyYears: number;
	driveLifespanYears: number;

	// Versioning multipliers
	versioningMultiplierNone: number;
	versioningMultiplierBasic: number;
	versioningMultiplierAggressive: number;

	// Electricity
	defaultUptimeHoursPerDay: number;
	defaultUptimeDaysPerMonth: number;

	// Costs
	offsiteCostPerTbMonth: number;
	domainAnnualCost: number;
	vpnMonthlyDefault: number;
	plexPassMonthly: number;

	// Hardware pricing (per TB)
	hddPricePerTB: number;
	ssdPricePerTB: number;

	// Device wattage estimates
	wattageNAS2Bay: number;
	wattageNAS4Bay: number;
	wattageMiniPcN100: number;
	wattageMiniPcN100_2HDD: number;
	wattageMiniPcN305_2HDD: number;
	wattageFullBuild4HDD: number;
	wattageFullBuild8HDD: number;

	// Break-even
	tcoProjectionYears: number;
	saasPriceInflationAnnual: number;
}

export const FACTORY_DEFAULTS: CalculationDefaults = {
	// Storage – movie sizes
	movieSize720p: 2,
	movieSize1080p: 6,
	movieSize4k: 30,
	movieSize4kHdr: 60,
	// Storage – episode sizes
	episodeSize720p: 0.7,
	episodeSize1080p: 2,
	episodeSize4k: 8,
	episodeSize4kHdr: 12,
	avgEpisodesPerSeason: 10,
	mediaGrowthRateAnnual: 0.3,
	fileGrowthRateAnnual: 0.1,
	growthProjectionYears: 3,
	storageHeadroomMultiplier: 1.15,
	systemOverheadGB: 100,

	// Drive failure
	hddAfr: 0.02,
	ssdAfr: 0.005,
	nasDriveAfr: 0.015,
	consumerWarrantyYears: 3,
	nasWarrantyYears: 5,
	driveLifespanYears: 6,

	// Versioning
	versioningMultiplierNone: 1.0,
	versioningMultiplierBasic: 1.3,
	versioningMultiplierAggressive: 1.5,

	// Electricity
	defaultUptimeHoursPerDay: 24,
	defaultUptimeDaysPerMonth: 30.44,

	// Costs
	offsiteCostPerTbMonth: 5.0,
	domainAnnualCost: 12.0,
	vpnMonthlyDefault: 5.46,
	plexPassMonthly: 5.0,

	// Hardware
	hddPricePerTB: 20,
	ssdPricePerTB: 60,

	// Wattage (average 24/7)
	wattageNAS2Bay: 18,
	wattageNAS4Bay: 30,
	wattageMiniPcN100: 10,
	wattageMiniPcN100_2HDD: 22,
	wattageMiniPcN305_2HDD: 28,
	wattageFullBuild4HDD: 65,
	wattageFullBuild8HDD: 90,

	// Break-even
	tcoProjectionYears: 5,
	saasPriceInflationAnnual: 0.0
};
