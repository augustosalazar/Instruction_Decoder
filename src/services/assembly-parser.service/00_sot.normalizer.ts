import { InstructionArg } from "@/types/instruction.types";
import { OperandExpectation } from "@/types/parser.types";

const INSTRUCTION_ARG_TO_OPERAND_EXPECTATION : Readonly<Record<InstructionArg, OperandExpectation>> = {
    rs                : 'register',
    rt                : 'register',
    rd                : 'register',
    imm16             : 'immediate16u',
    imm26             : 'immediate16u',
    imm21             : 'immediate16u',
    offset16          : 'immediate16s',
    offsetFromBase    : 'memory',
    shamt             : 'shamt5u',
    sa                : 'shamt5u'
}

function getOperandExpectationsFromArg ( args: ReadonlyArray<InstructionArg> ) 
    : ReadonlyArray<OperandExpectation> {
    return args.map( arg => INSTRUCTION_ARG_TO_OPERAND_EXPECTATION[arg]);
}