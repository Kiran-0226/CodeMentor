import { LanguageProfile } from './types';

export const pythonProfile: LanguageProfile = {
	name: 'Python',
	ids: ['python'],
	instructions: 'Apply Python semantics accurately. Explain iteration and comprehensions, mutable versus immutable values, dictionary/set lookup assumptions, slicing and copying costs, and recursion depth when relevant. Distinguish generators from materialized collections.'
};
