import { ParsedLine } from "@/types/parser.types";

// Rescatado del codigo legacy 
const LABEL_REGEX         = /^([a-zA-Z_][a-zA-Z0-9_]*):(.*)/;    // assembly-parser.service.ts [:82]
const DIRECTIVE_PREFIX    = '.';                                 // assembly-parser.service.ts[:74]
const COMMENT_CHAR        = '#';                                 // assembly-parser.service.ts[:68]

// Sacar el comentario
function stripComment ( line: string ) {
    const index = line.indexOf(COMMENT_CHAR);
    return ( index === -1 ? line : line.substring(0, index)).trim(); 
}

function isAssemblyDirective ( line: string ) {
    return line.startsWith(DIRECTIVE_PREFIX);
}

// Dado "t0,t1" => ['t0', 't1']    assembly-parser.service.ts[:109]
function splitOperands ( operandsString : string ) : ReadonlyArray<string> {
    return operandsString
            .split(',')
            .map(op => op.trim())
            .filter(op => op.length > 0);
}

type LineParseResult =
  | { ok: true;  line: ParsedLine; label: string | null }
  | { ok: false; error: string                          }
  | { ok: 'skip'                                        };
 
function parseLine ( raw: string, lineNumber: number ) : LineParseResult {
    // Extraer lo que no es comentario
    const clean = stripComment(raw);

    // Ignorar líneas vacias, comentarios o directivas
    if ( !clean )                       return { ok: 'skip' };
    if ( isAssemblyDirective(clean) )   return { ok: 'skip' };

    // Esa instruccion responde al regex?
    const labelMatch = clean.match(LABEL_REGEX)

    const label           = labelMatch?.[1] ?? null;
    const instructionText = labelMatch ? labelMatch[2]?.trim() : clean;

    // Si no hay nada parseado, skip
    if ( ! instructionText ) return { ok: 'skip' }

    const mnemonicRaw   = instructionText.split(/\s+/, 1)[0]!; // assembly-parser.service.ts[:107]
    const mnemonic      = mnemonicRaw.toLowerCase();
    const operandString = instructionText.substring(mnemonicRaw.length).trim();

    return {
        ok: true,
        line: {
            lineNumber, label, mnemonic,
            rawOperands: splitOperands(operandString)
        },
        label
    }

}