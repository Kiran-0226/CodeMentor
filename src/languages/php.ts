import { LanguageProfile } from './types';

export const phpProfile: LanguageProfile = {
	name: 'PHP',
	ids: ['php'],
	instructions: 'Apply PHP semantics accurately. Account for arrays as ordered maps, copy-on-write behavior where relevant, foreach iteration, associative keys, and loose versus strict comparison only when it affects the selected code.'
};
