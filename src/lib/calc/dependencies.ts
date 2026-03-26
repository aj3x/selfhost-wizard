import type { DependencyRule, ValidationError, PortConflict, ConfiguratorState } from '$lib/types/configurator';
import { getService, findService, getAllServices } from '$lib/services/registry';

export interface UnmetDependency {
	/** The service that has unmet deps */
	serviceId: string;
	rule: DependencyRule;
}

export interface ConflictPair {
	serviceA: string;
	serviceB: string;
}

/**
 * Find all unmet dependencies for the current selection.
 */
export function findUnmetDependencies(selectedIds: string[]): UnmetDependency[] {
	const selected = new Set(selectedIds);
	const unmet: UnmetDependency[] = [];

	for (const id of selectedIds) {
		const svc = findService(id);
		if (!svc) continue;

		for (const rule of svc.requires) {
			if (rule.type === 'all') {
				const missing = rule.serviceIds.filter((rid) => !selected.has(rid));
				if (missing.length > 0) {
					unmet.push({ serviceId: id, rule: { ...rule, serviceIds: missing } });
				}
			} else if (rule.type === 'one_of') {
				const hasOne = rule.serviceIds.some((rid) => selected.has(rid));
				if (!hasOne) {
					unmet.push({ serviceId: id, rule });
				}
			}
		}
	}

	return unmet;
}

/**
 * Find all conflicts in the current selection.
 */
export function findConflicts(selectedIds: string[]): ConflictPair[] {
	const selected = new Set(selectedIds);
	const conflicts: ConflictPair[] = [];
	const seen = new Set<string>();

	for (const id of selectedIds) {
		const svc = findService(id);
		if (!svc) continue;

		for (const conflictId of svc.conflicts) {
			if (selected.has(conflictId)) {
				const key = [id, conflictId].sort().join(':');
				if (!seen.has(key)) {
					seen.add(key);
					conflicts.push({ serviceA: id, serviceB: conflictId });
				}
			}
		}
	}

	return conflicts;
}

/**
 * Auto-resolve dependencies by adding required services.
 * Returns the set of service IDs that were added.
 */
export function autoResolveDependencies(
	selectedIds: string[],
	choices: Record<string, string>
): string[] {
	const selected = new Set(selectedIds);
	const added = new Set<string>();
	let changed = true;

	// Iterate until stable (new deps may have their own deps)
	while (changed) {
		changed = false;
		const current = [...selected, ...added];

		for (const id of current) {
			const svc = findService(id);
			if (!svc) continue;

			for (const rule of svc.requires) {
				if (rule.type === 'all') {
					for (const reqId of rule.serviceIds) {
						if (!selected.has(reqId) && !added.has(reqId)) {
							added.add(reqId);
							changed = true;
						}
					}
				} else if (rule.type === 'one_of') {
					const hasOne = rule.serviceIds.some(
						(rid) => selected.has(rid) || added.has(rid)
					);
					if (!hasOne) {
						// Use user's choice, or the default, or the first option
						const choice =
							choices[`${id}:${rule.label}`] ||
							rule.defaultId ||
							rule.serviceIds[0];
						if (choice && !selected.has(choice) && !added.has(choice)) {
							added.add(choice);
							changed = true;
						}
					}
				}
			}
		}
	}

	return [...added];
}

/**
 * Get recommended services that aren't currently selected.
 */
export function getRecommendations(selectedIds: string[]): { fromId: string; recommendedId: string; name: string }[] {
	const selected = new Set(selectedIds);
	const recs: { fromId: string; recommendedId: string; name: string }[] = [];
	const seen = new Set<string>();

	for (const id of selectedIds) {
		const svc = findService(id);
		if (!svc) continue;

		for (const recId of svc.recommends) {
			if (!selected.has(recId) && !seen.has(recId)) {
				const recSvc = findService(recId);
				if (recSvc) {
					seen.add(recId);
					recs.push({ fromId: id, recommendedId: recId, name: recSvc.name });
				}
			}
		}
	}

	return recs;
}

/**
 * Detect port conflicts in the current selection.
 */
export function detectPortConflicts(selectedIds: string[]): PortConflict[] {
	const portMap = new Map<string, string[]>();

	for (const id of selectedIds) {
		const svc = findService(id);
		if (!svc) continue;

		// Skip VPN-routed services (their ports move to gluetun)
		if (svc.vpnRouted && selectedIds.includes('gluetun')) continue;

		for (const port of svc.ports) {
			const proto = port.protocol || 'tcp';
			const key = `${port.host}/${proto}`;
			const existing = portMap.get(key) || [];
			existing.push(id);
			portMap.set(key, existing);
		}
	}

	const conflicts: PortConflict[] = [];
	for (const [key, services] of portMap) {
		if (services.length > 1) {
			const [portStr, proto] = key.split('/');
			conflicts.push({
				port: parseInt(portStr, 10),
				protocol: proto as 'tcp' | 'udp',
				services
			});
		}
	}

	return conflicts;
}

/**
 * Run all validation checks and return errors.
 */
export function validate(state: ConfiguratorState): ValidationError[] {
	const errors: ValidationError[] = [];
	const allIds = [...state.selectedServices, ...state.resolvedDependencies];

	// Check unmet dependencies
	const unmet = findUnmetDependencies(allIds);
	for (const u of unmet) {
		const svc = getService(u.serviceId);
		if (u.rule.type === 'all') {
			const names = u.rule.serviceIds.map((id) => {
				const s = findService(id);
				return s?.name || id;
			});
			errors.push({
				type: 'dependency',
				message: `${svc.name} requires ${names.join(', ')}`,
				serviceIds: [u.serviceId, ...u.rule.serviceIds]
			});
		} else {
			errors.push({
				type: 'dependency',
				message: `${svc.name} requires ${u.rule.label}`,
				serviceIds: [u.serviceId]
			});
		}
	}

	// Check conflicts
	const conflicts = findConflicts(allIds);
	for (const c of conflicts) {
		const a = getService(c.serviceA);
		const b = getService(c.serviceB);
		errors.push({
			type: 'conflict',
			message: `${a.name} and ${b.name} serve the same purpose — pick one`,
			serviceIds: [c.serviceA, c.serviceB]
		});
	}

	// Check port conflicts
	const portConflicts = detectPortConflicts(allIds);
	for (const pc of portConflicts) {
		const names = pc.services.map((id) => {
			const s = findService(id);
			return s?.name || id;
		});
		errors.push({
			type: 'port',
			message: `Port ${pc.port}/${pc.protocol} is used by ${names.join(' and ')}`,
			serviceIds: pc.services
		});
	}

	// Check VPN provider is configured when Gluetun is selected
	if (allIds.includes('gluetun')) {
		const gc = state.globalConfig;
		if (!gc.vpnProvider) {
			errors.push({
				type: 'config',
				message: 'Gluetun is selected but no VPN provider is configured',
				serviceIds: ['gluetun']
			});
		} else {
			// Check provider-specific credentials
			const hasCredentials = Object.values(gc.vpnEnv).some((v) => v.length > 0);
			if (!hasCredentials) {
				errors.push({
					type: 'config',
					message: 'VPN provider credentials are not set',
					serviceIds: ['gluetun']
				});
			}
		}
	}

	// Check required passwords are set for multi-container services
	if (allIds.includes('immich') && !state.serviceEnv['immich']?.IMMICH_DB_PASSWORD) {
		// Auto-generated in .env, so this is a warning not a blocker
	}

	// Check base path is absolute
	const gc = state.globalConfig;
	if (gc.baseDir && !gc.baseDir.startsWith('/')) {
		errors.push({
			type: 'config',
			message: 'Base directory must be an absolute path (starting with /)',
			serviceIds: []
		});
	}

	return errors;
}
