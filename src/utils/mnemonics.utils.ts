import { INSTRUCTION_ENCODINGS } from '../constants/instructions.constants';
import type { InstructionType } from '../types/instruction.types';

const unique = (values: Iterable<string>): ReadonlyArray<string> => [...new Set(values)];

// Filtrar por una condicion, hacerlo por sets dinamicos
function mnemonicsWhere(predicate: (enc: typeof INSTRUCTION_ENCODINGS[number]) => boolean): ReadonlyArray<string> {
    return unique(
        INSTRUCTION_ENCODINGS
            .filter(predicate)
            .map(e => e.mnemonic.toLowerCase())
    );
}

// Ver el array de argumentos y mapear por coincidencias el tipo de bits que consume
function hasArg ( args: ReadonlySet<string> ) {
    return ( 
        ( enc: typeof INSTRUCTION_ENCODINGS[number] ) => enc.args.some(arg => args.has(arg))
    );
}

export const getMnemonicsByType = (type: InstructionType): ReadonlyArray<string> =>
    mnemonicsWhere(e => e.type === type);

export const getMnemonicsByArgs = (args: ReadonlyArray<string>): ReadonlyArray<string> =>
    mnemonicsWhere(hasArg(new Set(args)));