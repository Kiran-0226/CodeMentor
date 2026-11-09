import { LanguageProfile } from './types';

export const rubyProfile: LanguageProfile = {
	name: 'Ruby',
	ids: ['ruby'],
	instructions: 'Apply Ruby semantics accurately. Explain enumerable methods and whether they mutate or return a new collection, distinguish symbols from strings when relevant, and account for recursion and collection costs.'
};
