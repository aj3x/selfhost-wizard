import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { type AssessmentState, DEFAULT_ASSESSMENT } from '$lib/types/assessment';

const STORAGE_KEY = 'selfhost-assessment';

function loadFromStorage(): AssessmentState {
	if (!browser) return structuredClone(DEFAULT_ASSESSMENT);
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...structuredClone(DEFAULT_ASSESSMENT), ...JSON.parse(stored) };
		}
	} catch {
		// Ignore corrupt data
	}
	return structuredClone(DEFAULT_ASSESSMENT);
}

function createAssessmentStore() {
	const { subscribe, set, update } = writable<AssessmentState>(loadFromStorage());

	// Persist on every change
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
			set(structuredClone(DEFAULT_ASSESSMENT));
		},
		exportJSON(): string {
			let current: AssessmentState = DEFAULT_ASSESSMENT;
			subscribe((v) => (current = v))();
			return JSON.stringify(current, null, 2);
		},
		importJSON(json: string) {
			try {
				const parsed = JSON.parse(json);
				if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
				set({ ...structuredClone(DEFAULT_ASSESSMENT), ...parsed });
				return true;
			} catch {
				return false;
			}
		}
	};
}

export const assessment = createAssessmentStore();
