import type { ComponentProps } from "react";

/** Project mark. Original artwork (not derived from the game's logo or art). */
export function LogoMark(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 2.5 28 9.25v13.5L16 29.5 4 22.75V9.25L16 2.5Z"
        stroke="var(--color-frontier-green)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M10 20c0-5 3-8 9-9-.5 6-3.5 9-9 9Z" fill="var(--color-frontier-green)" />
      <circle cx="20.5" cy="20.5" r="2.5" fill="var(--color-frontier-orange)" />
    </svg>
  );
}
