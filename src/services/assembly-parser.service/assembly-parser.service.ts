/* 
    AssemblyParser es el orquestador, se divide en 4 etapas:
        (00) - input.parser     -> Toma el string del usuario => ParsedLine
        (01) - operand.validate -> string[] => Operandos a validar 
        (02) - label.solver     -> Operandos a validar => Operandos Validados con labels resueltas
        (02) - operand.format   -> Operandos Validados con labels resueltas => string
*/

