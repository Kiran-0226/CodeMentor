import { LanguageProfile } from './types';

export const kotlinProfile: LanguageProfile = {
	name: 'Kotlin',
	ids: ['kotlin'],
	instructions: 'Apply Kotlin semantics accurately. Distinguish eager collection operations from sequences, explain null-safety and scope functions only when relevant, and account for coroutine behavior without treating suspension as parallel execution.'
};
