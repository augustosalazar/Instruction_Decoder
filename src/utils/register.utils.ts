import { RegToken } from "@/types/domain.types";
import { REG_ZERO, REGISTER_BY_BITS, REGISTER_BY_NAME, RegisterBits, RegisterName } from "@/constants/registers.constants";

export const isRegisterToken = (token: string): token is RegToken =>
  token.startsWith("$") && token.slice(1) in REGISTER_BY_NAME;

export const regNameToBits = (name: RegisterName): RegisterBits =>
    REGISTER_BY_NAME[name] ?? REG_ZERO;
 
export const regBitsToName = (bits: RegisterBits): RegisterName =>
    REGISTER_BY_BITS[bits];
 