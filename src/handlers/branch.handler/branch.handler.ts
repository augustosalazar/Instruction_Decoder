import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { HandlerError, type InstructionHandler } from "@/types/handler.types";
import type { DecodedInstruction } from "@/types/instruction.types";
import type { MipsVersion } from "@/types/version.types";
import { sliceBits } from "@/utils/bit.utils";
import { BRANCH_RULES } from "./branch.rules";
import { buildInstructionDescriptions, getEncoding } from "@/utils/handler.utils";

const HANDLER = "BRANCH-HANDLER";

function isBranchMnemonic(mnemonic: string): boolean {
    return BRANCH_RULES.some(rule => rule.matchesMnemonic(mnemonic));
}

function isBranchEncoding(encoding: { mnemonic: string }): boolean {
    return isBranchMnemonic(encoding.mnemonic);
}

function findRuleByMnemonic(mnemonic: string) {
    return BRANCH_RULES.find(rule => rule.matchesMnemonic(mnemonic));
}

function findEncodingByOpcode(opcode: string) {
    return Object.values(ENCODING_BY_MNEMONIC).find(
        encoding =>
            encoding.opcode === opcode &&
            isBranchEncoding(encoding),
    );
}

export const branchHandler = {
    instructions: buildInstructionDescriptions(isBranchEncoding),

    encode(instruction: DecodedInstruction, version: MipsVersion): string {
        const encoding = getEncoding(instruction.mnemonic, HANDLER);
        const rule = findRuleByMnemonic(instruction.mnemonic);

        if (!rule) {
            throw new HandlerError({
                type: "UNKNOWN_MNEMONIC",
                message: `[${HANDLER}] branch no soportado '${instruction.mnemonic}'`,
            });
        }

        return rule.encode(instruction, encoding);
    },

    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { opcode } = sliceBits(bits32);

        const encoding = findEncodingByOpcode(opcode);

        if (!encoding)
            throw new HandlerError({ type: "UNKNOWN_OPCODE", message: `[${HANDLER}] opcode desconocido ${opcode}` });

        const rule = findRuleByMnemonic(encoding.mnemonic);

        if (!rule?.decode)
            throw new HandlerError({ type: "UNKNOWN_MNEMONIC", message: `[${HANDLER}] decode no soportado para '${encoding.mnemonic}'`});

        return rule.decode(bits32, encoding);
    },
    
} satisfies InstructionHandler;