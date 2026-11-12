import type { ptBR } from "./pt-BR";

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : { [K in keyof T]: Widen<T[K]> };

/** Shape every locale must implement. Derived from pt-BR so there is a single source of truth. */
export type Messages = Widen<typeof ptBR>;
