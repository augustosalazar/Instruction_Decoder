/* 
    AssemblyParser es el orquestador, se divide en 4 etapas:
        (01) - input.parser     -> Toma el string del usuario => ParsedLine
        (02) - operand.validate -> string[] => Operandos a validar 
        (03) - label.solver     -> Operandos a validar => Operandos Validados con labels resueltas
        (04) - operand.format   -> Operandos Validados con labels resueltas => string
*/

