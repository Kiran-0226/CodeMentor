import { LanguageProfile } from './types';

export const rustProfile: LanguageProfile = {
	name: 'Rust',
	ids: ['rust'],
	instructions: 'Apply Rust semantics accurately. Explain ownership, borrowing, moves, references, and collection behavior only where they affect this code. Distinguish compile-time types from runtime work and avoid implying unsafe behavior unless an unsafe block is present.'
};
