import { DICTIONARY_PART_A } from './dictionary-a';
import { DICTIONARY_PART_B } from './dictionary-b';

export const DICTIONARY_WORDS: string[] = [...DICTIONARY_PART_A, ...DICTIONARY_PART_B];
export const DICTIONARY_SET: Set<string> = new Set(DICTIONARY_WORDS);
