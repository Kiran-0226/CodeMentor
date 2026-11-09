import { LanguageProfile } from './types';

export const csharpProfile: LanguageProfile = {
	name: 'C#',
	ids: ['csharp'],
	instructions: 'Apply C# and .NET semantics accurately. Distinguish value types from reference types, describe LINQ laziness/materialization, collection operation costs, async/await behavior, and nullable types when relevant.'
};
