import { RegToken } from "@/types/domain.types";
import { REGISTER_BY_NAME } from "@/constants/registers.constants";

export const isRegisterToken = (token: string): token is RegToken =>
  token.startsWith("$") && token.slice(1) in REGISTER_BY_NAME;