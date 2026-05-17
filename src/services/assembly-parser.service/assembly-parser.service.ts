/* 
    AssemblyParser es el orquestador, se divide en 4 etapas:
        (01) - input.parser     -> Toma el string del usuario => ParsedLine
        (02) - operand.validate -> string[] => Operandos a validar 
        (03) - label.solver     -> Operandos a validar => Operandos Validados con labels resueltas
        (04) - operand.format   -> Operandos Validados con labels resueltas => string
*/

import { LabelInfo, ParsedLine, ParseResult, ValidatedInstruction } from "@/types/parser.types";
import { parseLine } from "./01_input.parser";
import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { getOperandExpectationsFromArg } from "@/utils/args.utils";
import { validateOperands } from "./02_operand.validate";
import { resolveLabels } from "./03_label.solver";
import { formatInstruction } from "./04_operand.formater";

const BASE_ADDRESS = 0x00400000; // assembly-parser.service.ts[:44]

// ── Orquestador ────────────────────────────────────────────────────────────
export function parseAssembly(assemblyCode: string): ParseResult {
    if (!assemblyCode.trim())
        return { instructions: [], errors: ["No se proporcionó código ensamblador."] };

    const step1 = parseLines(assemblyCode);
    if (step1.errors.length) return { instructions: [], errors: step1.errors };

    const step2 = validateLines(step1.parsedLines);
    if (step2.errors.length) return { instructions: [], errors: step2.errors };

    const step3 = resolveAndFormat(step2.validated, step1.labelMap);
    return step3.errors.length
        ? { instructions: [], errors: step3.errors }
        : { instructions: step3.instructions, errors: [] };
}


// ── Paso 1: de texto a líneas parseadas y labels ────────────────────────────────────
function parseLines(assemblyCode: string) :
    { parsedLines: ParsedLine[]; labelMap: Map<string, LabelInfo>; errors: string[] } {

    const errors        : string[] = [];
    const labelMap      = new Map<string, LabelInfo>();
    const parsedLines   : ParsedLine[] = [];

    let instructionIndex = 0;

    for (const [i, rawLine] of assemblyCode.split("\n").entries()) {
        const result = parseLine( rawLine, i+1 )

        if ( result.ok === "skip" ) continue;

        if ( !result.ok ) { errors.push(result.error); continue }

        if ( result.label ){
            const lowercaseLabel = result.label.toLowerCase();

            if ( labelMap.has(lowercaseLabel) ){
                errors.push(`Línea ${result.line.lineNumber}: Etiqueta duplicada '${result.label}'.`);
            } 
            
            else {
                labelMap.set(lowercaseLabel, {
                    name: lowercaseLabel,
                    address: BASE_ADDRESS + instructionIndex * 4,
                    lineNumber: result.line.lineNumber
                });
            }
        }

        parsedLines.push(result.line);
        instructionIndex++;
    }

    return { parsedLines, labelMap, errors };
}

// ── Paso 2: Validar Lineas ────────────────────────────────────────────────
function validateLines(parsedLines: ParsedLine[]): 
    { validated: ValidatedInstruction[]; errors: string[] } {

    const errors    : string[] = [];
    const validated : ValidatedInstruction[] = [];

    parsedLines.forEach((result, index) => {
        const line = result;

        const encoding = ENCODING_BY_MNEMONIC[line.mnemonic];

        if ( !encoding ){
            errors.push(`Línea ${line.lineNumber}: Instrucción desconocida '${line.mnemonic}'.`);
            return;
        }

        const expectation = getOperandExpectationsFromArg(encoding.args);
        const validatedOperands = validateOperands(line.mnemonic, line.rawOperands, expectation, line.lineNumber)

        if ( ! validatedOperands.ok ){
            errors.push(...validatedOperands.errors )
            return;
        }

        validated.push({
            lineNumber: line.lineNumber,
            address: BASE_ADDRESS + index * 4,
            mnemonic: line.mnemonic,
            operands: validatedOperands.operands
        });
    });

    return { validated, errors }
}

// ── Paso 3: Concretar labels y formatear instrucciones  ────────────────────────────────────────────────
function resolveAndFormat(validated: ValidatedInstruction[], labelMap: Map<string, LabelInfo>): 
    { instructions: string[]; errors: string[] } {

    const errors : string[] = []
    const instructions : string[] = [];

    for (const inst of validated) {
        const resolution = resolveLabels(
            inst.mnemonic,
            inst.operands,
            inst.address,
            labelMap,
            inst.lineNumber,
        );

        if ( ! resolution.ok ) {
            errors.push(resolution.error);
            continue;
        }

        instructions.push( formatInstruction(inst.mnemonic, resolution.operands));
    }

    return { instructions, errors };
}