import { DecodedInstruction } from "./instruction.types";
import { Mnemonic } from "./mnemonic.types"
import { MipsVersion } from "./version.types";

/*
    InstructionHandler es un objeto tipado que maneja las
    labores de encode y decode para una familia de instrucciones.

    NOTA
        * SOLID: 
          (1) Para cumplir con el principio de Single-Responsability,
          cada Handler se hará consciente de solo una familia de instrucciones
          ej: (r-type-hanlder, i-type-handler, etc...)
         
          (2) Para cumplir con Open/Closed, cada nueva familia de instrucciones
          dispondrá de un archivo y una entrada de registro, no se tocan las 
          ya existentes. 
*/

export type InstructionDescription = {
    readonly mnemonic   : Mnemonic;
    readonly opcode     : string;
}

export type InstructionHandler = {  
    readonly instructions: ReadonlyArray<InstructionDescription>
    readonly encode      : ( instruction: DecodedInstruction, version: MipsVersion ) => string;
    readonly decode      : ( bits32: string, version: MipsVersion ) => DecodedInstruction;
}

/*
    Para manejo de errores
*/
 export type HandlerErrorType = 
    | 'UNKNOWN_MNEMONIC'
    | 'UNKNOWN_OPCODE'
    | 'UNKNOWN_FUNCT'
    | 'INVALID_REGISTER'
    | 'INVALID_IMMEDIATE'
    | 'INVALID_ARGS'
    | 'VERSION_MISMATCH';

export class HandlerError extends Error {
    public type     : HandlerErrorType;
    public details? : unknown;

    constructor ( params : { message: string, type: HandlerErrorType, details?: unknown } ) {
        super(params.message);
        this.type = params.type ?? 'INTERNAL_ERROR';
        this.details = params.details;
    }
}

