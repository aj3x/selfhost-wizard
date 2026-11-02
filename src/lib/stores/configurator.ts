import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	type ConfiguratorState,
	type GlobalConfig,
	DEFAULT_CONFIGURATOR_STATE,
	DEFAULT_GLOBAL_CONFIG,
	GENERATED_SECRETS
} from '$lib/types/configurator';
import { autoResolveDependencies } from '$lib/calc/dependencies';

const STORAGE_KEY = 'selfhost-configurator';

function loadFromStorage(): ConfiguratorState {
	if (!browser) return structuredClone(DEFAULT_CONFIGURATOR_STATE);
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				...structuredClone(DEFAULT_CONFIGURATOR_STATE),
				...parsed,
				globalConfig: { ...DEFAULT_GLOBAL_CONFIG, ...parsed.globalConfig }
			};
		}
	} catch {
		// Ignore corrupt data
	}
	return structuredClone(DEFAULT_CONFIGURATOR_STATE);
}

/** Generate a random alphanumeric secret, using rejection sampling to avoid modulo bias */
function generateSecret(length = 24): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const limit = 256 - (256 % chars.length);
	let secret = '';
	while (secret.length < length) {
		for (const b of crypto.getRandomValues(new Uint8Array(length))) {
			if (b < limit && secret.length < length) secret += chars[b % chars.length];
		}
	}
	return secret;
}

/** Run auto-resolution, generate any missing secrets, and return updated state */
function resolveState(state: ConfiguratorState): ConfiguratorState {
	const added = autoResolveDependencies(
		state.selectedServices,
		state.dependencyChoices
	);
	const generatedSecrets = { ...state.generatedSecrets };
	for (const id of [...state.selectedServices, ...added]) {
		for (const key of GENERATED_SECRETS[id] ?? []) {
			generatedSecrets[key] ||= generateSecret();
		}
	}
	return { ...state, resolvedDependencies: added, generatedSecrets };
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
		set(state: ConfiguratorState) {
			set(resolveState(state));
		},
		update,

		/** Toggle a service on or off. Auto-added dependencies stay until their dependents go. */
		toggleService(id: string) {
			updateAndResolve((state) => {
				const selected = new Set(state.selectedServices);

				if (selected.has(id)) {
					selected.delete(id);
				} else if (!state.resolvedDependencies.includes(id)) {
					selected.add(id);
				}

				return { ...state, selectedServices: [...selected], activePreset: null };
			});
		},

		/** Apply a preset */
		applyPreset(presetId: string, serviceIds: string[]) {
			updateAndResolve((state) => ({
				...state,
				selectedServices: serviceIds,
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
			set(structuredClone(DEFAULT_CONFIGURATOR_STATE));
		}
	};
}

export const configurator = createConfiguratorStore();
