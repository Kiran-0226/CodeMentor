import { LanguageProfile } from './types';

export const genericProfile: LanguageProfile = {
	name: 'Unknown or unsupported language',
	ids: [],
	instructions: 'Use only syntax and semantics that are clear from the selected code. If the language or behavior is uncertain, say so instead of guessing.'
};
