import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	type ConfiguratorState,
	type GlobalConfig,
	DEFAULT_CONFIGURATOR_STATE,
	DEFAULT_GLOBAL_CONFIG
} from '$lib/types/configurator';
import { autoResolveDependencies } from '$lib/calc/dependencies';

const STORAGE_KEY = 'selfhost-configurator';

function loadFromStorage(): ConfiguratorState {
	if (!browser) return DEFAULT_CONFIGURATOR_STATE;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				...DEFAULT_CONFIGURATOR_STATE,
				...parsed,
				globalConfig: { ...DEFAULT_GLOBAL_CONFIG, ...parsed.globalConfig }
			};
		}
	} catch {
		// Ignore corrupt data
	}
	return DEFAULT_CONFIGURATOR_STATE;
}

/** Run auto-resolution and return updated state */
function resolveState(state: ConfiguratorState): ConfiguratorState {
	const added = autoResolveDependencies(
		state.selectedServices,
		state.dependencyChoices
	);
	return { ...state, resolvedDependencies: added };
}

function createConfiguratorStore() {
	const { subscribe, set, update } = writable<ConfiguratorState>(resolveState(loadFromStorage()));

	if (browser) {
		subscribe((value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		});
	}

	/** Update and auto-resolve dependencies */
	function updateAndResolve(fn: (state: ConfiguratorState) => ConfiguratorState) {
		update((state) => resolveState(fn(state)));
	}

	return {
		subscribe,
		set,
		update,

		/** Toggle a service on or off */
		toggleService(id: string) {
			updateAndResolve((state) => {
				const selected = new Set(state.selectedServices);
				const resolved = new Set(state.resolvedDependencies);

				if (selected.has(id)) {
					selected.delete(id);
				} else if (resolved.has(id)) {
					resolved.delete(id);
				} else {
					selected.add(id);
				}

				return {
					...state,
					selectedServices: [...selected],
					resolvedDependencies: [...resolved],
					activePreset: null
				};
			});
		},

		/** Set the full selection (e.g. from a preset) */
		setSelection(ids: string[]) {
			updateAndResolve((state) => ({
				...state,
				selectedServices: ids,
				resolvedDependencies: [],
				dependencyChoices: {}
			}));
		},

		/** Apply a preset */
		applyPreset(presetId: string, serviceIds: string[]) {
			updateAndResolve((state) => ({
				...state,
				selectedServices: serviceIds,
				resolvedDependencies: [],
				dependencyChoices: {},
				activePreset: presetId
			}));
		},

		/** Record a dependency choice. Key format: "serviceId:ruleLabel" */
		setDependencyChoice(key: string, chosenId: string) {
			updateAndResolve((state) => ({
				...state,
				dependencyChoices: { ...state.dependencyChoices, [key]: chosenId }
			}));
		},

		/** Update a service's environment variable */
		setServiceEnv(serviceId: string, key: string, value: string) {
			update((state) => ({
				...state,
				serviceEnv: {
					...state.serviceEnv,
					[serviceId]: { ...state.serviceEnv[serviceId], [key]: value }
				}
			}));
		},

		/** Update global config */
		updateGlobalConfig(partial: Partial<GlobalConfig>) {
			update((state) => ({
				...state,
				globalConfig: { ...state.globalConfig, ...partial }
			}));
		},

		/** Update VPN env vars */
		setVpnEnv(env: Record<string, string>) {
			update((state) => ({
				...state,
				globalConfig: { ...state.globalConfig, vpnEnv: env }
			}));
		},

		/** Reset everything */
		reset() {
			set({ ...DEFAULT_CONFIGURATOR_STATE, globalConfig: { ...DEFAULT_GLOBAL_CONFIG } });
		}
	};
}

export const configurator = createConfiguratorStore();
