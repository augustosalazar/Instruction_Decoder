import { Mnemonic } from "./mnemonic.types";
import { Operand } from "./operand.types";
import { MipsVersion } from "./version.types";

export type InstructionType = 'R' | 'I' | 'J' | 'B';

export type InstructionFamily =
    | 'r-type' | 'i-type' | 'memory'
    | 'branch' | 'jump'

export type Instruction = {
    readonly mnemonic   : Mnemonic;
    readonly version    : MipsVersion;
    readonly bits32     : string;
}

export type DecodedInstruction = {
    readonly mnemonic   : Mnemonic;
    readonly operands   : ReadonlyArray<Operand>
}

export type InstructionEncoding = {
    readonly mnemonic       : Mnemonic;
    readonly description    : string;
    readonly example?       : string;
    readonly template?      : string;
    readonly type           : InstructionType;
    readonly opcode         : string;
    readonly funct?         : string;
    readonly shamt?         : string;
    readonly rt?            : string;
    readonly version        : ReadonlyArray<MipsVersion | 'common'>;
    readonly args           : ReadonlyArray<InstructionArg>;
}

export type InstructionArg = 
    | 'rs'       | 'rt'     | 'rd'      // Para registros
    | 'imm16'    | 'imm26'  | 'imm21'   // Tamaños del immediate
    | 'offset16' | 'offsetFromBase'     // Tipo de offset
    | 'shamt'
    | 'sa';


