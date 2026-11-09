import { LanguageProfile } from './types';

export const javaProfile: LanguageProfile = {
	name: 'Java',
	ids: ['java'],
	instructions: 'Apply Java semantics accurately. Distinguish primitive values from object references, account for collection operations and their usual average/worst-case costs, and explain class, method, exception, and recursion behavior when relevant.'
};
