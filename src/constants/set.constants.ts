import { getMnemonicsByArgs, getMnemonicsByType } from "@/utils/mnemonics.utils";

export const R_TYPE_MNEMONICS = getMnemonicsByType('R');
export const I_TYPE_MNEMONICS = getMnemonicsByType('I');
export const J_TYPE_MNEMONICS = getMnemonicsByType('J');

export const MEMORY_MNEMONICS = getMnemonicsByArgs(['offsetFromBase', 'offset(rs)']);
export const BRANCH_MNEMONICS = getMnemonicsByArgs(['offset16', 'imm21', 'offset']);
export const JUMP_MNEMONICS   = getMnemonicsByArgs(['imm26', 'address']);