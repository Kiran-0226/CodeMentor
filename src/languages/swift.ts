import { LanguageProfile } from './types';

export const swiftProfile: LanguageProfile = {
	name: 'Swift',
	ids: ['swift'],
	instructions: 'Apply Swift semantics accurately. Account for value semantics and copy-on-write collections, optionals, lazy sequences, async/await, and mutating operations when relevant.'
};
