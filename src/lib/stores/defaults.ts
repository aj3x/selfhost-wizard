import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { type CalculationDefaults, FACTORY_DEFAULTS } from '$lib/types/defaults';

const STORAGE_KEY = 'selfhost-defaults';

function loadFromStorage(): CalculationDefaults {
	if (!browser) return FACTORY_DEFAULTS;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...FACTORY_DEFAULTS, ...JSON.parse(stored) };
		}
	} catch {
		// Ignore corrupt data
	}
	return FACTORY_DEFAULTS;
}

function createDefaultsStore() {
	const { subscribe, set, update } = writable<CalculationDefaults>(loadFromStorage());

	if (browser) {
		subscribe((value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update,
		reset() {
			set({ ...FACTORY_DEFAULTS });
		}
	};
}

export const defaults = createDefaultsStore();
