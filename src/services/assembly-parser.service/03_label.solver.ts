import { LabelInfo, ValidatedOperand } from "@/types/parser.types";

type Resolution = 
    | { ok: true; value: number }
    | { ok: false; error: string }

function resolveBranchOffset ( targetAddress: number, currentAddress: number, label: string, lineNumber: number ) : Resolution {
    const relativeBytes = targetAddress - (currentAddress + 4);      // assembly-parser.service.ts[:365]

    if ( relativeBytes % 4 !== 0 )
        return { ok: false, error: `Línea ${lineNumber}: branch offset no alineado para '${label}'.` };

    const offset = relativeBytes >> 2;
    if (offset < -32768 || offset > 32767)
        return { ok: false, error: `Línea ${lineNumber}: branch offset fuera de rango para '${label}'.` };
 
    return { ok: true, value: offset };
}

function resolveJumpAddress ( targetAddress: number, currentAddress: number, label: string, lineNumber: number ) : Resolution {
    if ( targetAddress % 4 !== 0 )
        return { ok: false, error: `Línea ${lineNumber}: jump target no alineado para '${label}'.` };

    const regionPC      = (currentAddress + 4)    & 0xF0000000;
    const regionTarget  = targetAddress           & 0xF0000000;
    if (regionPC !== regionTarget)
        return { ok: false, error: `Línea ${lineNumber}: jump fuera de región 256MB para '${label}'.` };
 
    return { ok: true, value: (targetAddress >>> 2) & 0x03FFFFFF };
};


type LabelResolution = 
    | { ok: true ;  operands: ReadonlyArray<ValidatedOperand> }
    | { ok: false;  error: string }

function resolveLabels ( 
    mnemonic          : string,
    operands          : ReadonlyArray<ValidatedOperand>,
    currentAddress    : number,
    labelMap          : ReadonlyMap<string, LabelInfo>,
    lineNumber        : number,
) : LabelResolution {

    const isBranch = BRANCH_MNEMONICS.has(mnemonic);
    const isJump   = JUMP_MNEMONICS.has(mnemonic);

    if ( !isBranch && !isJump ) return { ok:true, operands };


    const resolved : ValidatedOperand[] = [];

    for (let i = 0; i < operands.length; i++) {
        
        const op = operands[i];
        if ( !op ) return { ok: false, error: `Línea ${lineNumber}: operando inválido.` };
        
        const shouldResolve =
            (isBranch && i === operands.length - 1) ||
            (isJump && i === 0);
        
        if (op.kind !== 'label' || !shouldResolve) {
            resolved.push(op);
            continue;
        }

        const info = labelMap.get(op.name);
        if (!info) return { ok: false, error: `Línea ${lineNumber}: etiqueta no definida '${op.name}'.` }; // assembly-parser.service.ts[:360]

        const result = isBranch
            ? resolveBranchOffset(info.address, currentAddress, op.name, lineNumber)
            : resolveJumpAddress (info.address, currentAddress, op.name, lineNumber);
 
        if (!result.ok) return result;

        resolved.push({ kind: 'immediate', value: result.value });
    };

    return { ok: true, operands: resolved };
}