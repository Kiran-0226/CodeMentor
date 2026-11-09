import { LanguageProfile } from './types';

export const goProfile: LanguageProfile = {
	name: 'Go',
	ids: ['go'],
	instructions: 'Apply Go semantics accurately. Distinguish slices from arrays and maps, account for slice growth/copying, map lookup assumptions, goroutines, channels, and error-return patterns when present.'
};
