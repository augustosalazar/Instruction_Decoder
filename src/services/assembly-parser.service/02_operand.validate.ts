import { REGISTER_BY_NAME, RegisterName } from "@/constants/registers.constants"
import { OperandExpectation, ValidatedOperand } from "@/types/parser.types";

function parseRegister ( raw: string ) : string | null {
    const clean = raw.toLowerCase().replace(/\$/, '') as RegisterName
    return REGISTER_BY_NAME[clean] ? clean : null
}

function parseImmediate ( raw: string ) : number | null {
    const clean = raw.toLowerCase().trim();
    const value = clean.startsWith('0x')  ?  parseInt(clean.slice(2), 16)   // assembly-parser.service.ts[:418]
                : clean.startsWith('-0x') ? -parseInt(clean.slice(3), 16)
                : parseInt(clean, 10);
    return isNaN(value) ? null : value;
};

function parseMemory ( raw: string ) : { offset: number; base: string } | null {
    const match = raw.match(/^(-?(?:\d+|0x[0-9a-f]+))\s*\(\s*(\$?[a-z0-9]+)\s*\)$/i); // assembly-parser.service.ts[:426]
    if ( !match ) return null;

    const imm = match[1];
    const reg = match[2];

    if (!imm || !reg) return null;
    
    const offset = parseImmediate(imm);
    const base = parseRegister(reg);

    if (base === null || offset === null) return null;

    return { offset, base };
}

function isPotentialLabel ( raw: string ) : boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)     // assembly-parser.service.ts[:437]
}

/* ------------------------------------------ Validacion Individual ------------------------------------------ */
type OperandValidationResult =
    | { ok:true; operand: ValidatedOperand }
    | { ok:false; error: string            }

function validateOperand ( 
    raw: string, expected: OperandExpectation, index: number, lineNumber: number, mnemonic: string 
) : OperandValidationResult {

    const pos = `Línea ${lineNumber}, operando #${index + 1} ('${raw}')`;

    switch (expected) {

        case 'label': {
            if (!isPotentialLabel(raw))
                return { ok: false, error: `${pos}: no es un nombre de etiqueta válido.` };
            return { ok: true, operand: { kind: 'label', name: raw.toLowerCase() } };
        }

        case 'register' : {
            const name = parseRegister(raw);
            if (!name) return { ok: false, error: `${pos}: no es un registro MIPS válido.` };   // assembly-parser.service.ts[:276]
            return { ok: true, operand: { kind: 'register', name } };
        }

        case 'immediate16s':
        case 'immediate16u': {
            const value = parseImmediate(raw);
            if (value === null) return { ok: false, error: `${pos}: no es un inmediato válido.` };

            // Definir minimo y maximo basado en si es signed o unsigned 
            const [min, max] = expected === 'immediate16s' ? [-32768, 32767] : [0, 65535]; // assembly-parser.service.ts[:285]

            if (value < min || value > max) return { ok: false, error: `${pos}: fuera de rango [${min}, ${max}] para '${mnemonic}'.` };
            return { ok: true, operand: { kind: 'immediate', value } };
        }

        case 'shamt5u': {
            const value = parseImmediate(raw);
            if (value === null) return { ok: false, error: `${pos}: no es un inmediato válido para shamt.` };

            if (value < 0 || value > 31)
              return { ok: false, error: `${pos}: shamt fuera de rango [0, 31].` };
            return { ok: true, operand: { kind: 'immediate', value } };
        }
 
        case 'memory': {
            const mem = parseMemory(raw);
            if (!mem) return { ok: false, error: `${pos}: formato inválido, se esperaba offset(base).` };

            if (mem.offset < -32768 || mem.offset > 32767)
                return { ok: false, error: `${pos}: offset de memoria fuera de rango.` };
            return { ok: true, operand: { kind: 'memory', offset: mem.offset, base: mem.base } };
        }
    }
}

/* ------------------------------------------ Validacion Completa ------------------------------------------ */
type ValidationResult = 
    | { ok: true; operands: ReadonlyArray<ValidatedOperand> }
    | { ok: false; errors: ReadonlyArray<string> }

export function validateOperands ( 
    mnemonic: string, rawOperands: ReadonlyArray<string>, expectations: ReadonlyArray<OperandExpectation>, lineNumber: number
    ): ValidationResult {

        // assembly-parser.service.ts[:260]
        if ( rawOperands.length !== expectations.length )
            return { ok: false, errors: [`Línea ${lineNumber}: '${mnemonic}' espera ${expectations.length} operandos, recibió ${rawOperands.length}.`]}

        const identifiedOperands: ValidatedOperand[] = [];
        for ( let i = 0; i < expectations.length; i++ ) {
            const rawOperand = rawOperands[i];
            const expectation = expectations[i];

            if ( !rawOperand || !expectation ) 
                return { ok: false, errors: [`Línea ${lineNumber}: '${mnemonic}' tiene un operando inválido.`]}
            
            const result = validateOperand( rawOperand, expectation, i, lineNumber, mnemonic);
            if (!result.ok) return { ok: false, errors: [result.error] };
            identifiedOperands.push(result.operand);
        }

        return { ok: true, operands: identifiedOperands }
}