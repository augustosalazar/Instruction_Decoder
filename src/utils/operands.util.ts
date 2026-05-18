import { RegisterName } from "@/constants/registers.constants";
import { ImmediateOperand, RegisterOperand } from "@/types/operand.types";

export const regToOperand = (name: RegisterName): RegisterOperand =>
    ({ kind: 'register', name });
 
export const immediateToOperand = (value: number): ImmediateOperand =>
    ({ kind: 'immediate', value });
 