import { RegisterName } from "@/constants/registers.constants";
import { ImmediateOperand, Operand, RegisterOperand } from "@/types/operand.types";
import { isRegisterToken } from "./register.utils";
import { HandlerError } from "@/types/handler.types";

export const regToOperand = (name: RegisterName): RegisterOperand =>
    ({ kind: 'register', name });
 
export const immediateToOperand = (value: number): ImmediateOperand =>
    ({ kind: 'immediate', value });
 
export const tokenToOperand = (token: string, nextToken?: string): { operand: Operand; consumed: number } => {

    if (isRegisterToken(token))
        return { operand:  { kind: 'register', name: token.slice(1) as RegisterName }, consumed: 1 };

    const asNumber = parseInt(token, 10);

    /*
    Es un número?
        El token siguiente es un registro?
            Entonces los dos juntos forman un operando de memoria
    */
    if ( ! isNaN(asNumber) ) {
        if (nextToken && isRegisterToken(nextToken))
            return { operand:  { kind: 'memory', offset: asNumber, base: nextToken.slice(1) }, consumed: 2};

        return { operand:  { kind: 'immediate', value: asNumber }, consumed: 1};
    }

    throw new HandlerError({ type:'INVALID_ARGS', message: `Token no reconocido: '${token}'`});
};