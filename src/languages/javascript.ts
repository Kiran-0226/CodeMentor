import { LanguageProfile } from './types';

export const javascriptProfile: LanguageProfile = {
	name: 'JavaScript / TypeScript',
	ids: ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
	instructions: 'Apply JavaScript and TypeScript semantics accurately. Account for arrays, objects, map/filter/reduce, closures, mutation, optional chaining, async/await, promises, and TypeScript types only when present. Do not treat TypeScript type declarations as runtime operations.'
};
