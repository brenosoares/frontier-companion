export interface SensitiveFinding {
  path: string;
  kind: string;
  sample: string;
}

const PATTERNS: readonly { kind: string; regex: RegExp }[] = [
  { kind: "windows-path", regex: /\b[A-Za-z]:[\\/]/ },
  { kind: "unix-home-path", regex: /\/(?:Users|home)\/\w+/ },
  { kind: "email", regex: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { kind: "url", regex: /https?:\/\/\S+/i },
];

/** Walks any JSON-like value and reports strings that look like local paths, e-mails or URLs. */
export function findSensitiveStrings(value: unknown, path = "$"): SensitiveFinding[] {
  if (typeof value === "string") {
    const match = PATTERNS.find(({ regex }) => regex.test(value));
    return match ? [{ path, kind: match.kind, sample: value.slice(0, 80) }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => findSensitiveStrings(child, `${path}[${index}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      findSensitiveStrings(child, `${path}.${key}`),
    );
  }
  return [];
}
