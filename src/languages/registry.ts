import { cProfile } from './c';
import { csharpProfile } from './csharp';
import { genericProfile } from './generic';
import { goProfile } from './go';
import { javaProfile } from './java';
import { javascriptProfile } from './javascript';
import { kotlinProfile } from './kotlin';
import { phpProfile } from './php';
import { pythonProfile } from './python';
import { rubyProfile } from './ruby';
import { rustProfile } from './rust';
import { swiftProfile } from './swift';
import { LanguageProfile } from './types';

const profiles: readonly LanguageProfile[] = [
	javascriptProfile,
	pythonProfile,
	javaProfile,
	csharpProfile,
	cProfile,
	goProfile,
	rustProfile,
	phpProfile,
	rubyProfile,
	kotlinProfile,
	swiftProfile
];

const profileById = new Map(profiles.flatMap(profile => profile.ids.map(id => [id, profile] as const)));

export function getLanguageProfile(languageId: string): LanguageProfile {
	return profileById.get(languageId.toLowerCase()) ?? {
		...genericProfile,
		name: languageId && languageId !== 'plaintext' ? languageId : genericProfile.name
	};
}
