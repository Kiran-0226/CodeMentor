import { LanguageProfile } from './types';

export const cProfile: LanguageProfile = {
	name: 'C / C++',
	ids: ['c', 'cpp'],
	instructions: 'Apply C or C++ semantics accurately. Account for pointers/references, array bounds, value copies, allocation and deallocation, recursion, and integer behavior when relevant. Do not assume a container operation is constant-time without identifying the container.'
};
