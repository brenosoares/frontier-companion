/** Replaces `{name}` placeholders. Used for strings that must cross the server/client boundary. */
export function formatTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    key in values ? String(values[key]) : placeholder,
  );
}

/** `90` -> "1 min 30 s" (localized). Sub-minute values stay in seconds. */
export function formatDuration(totalSeconds: number, locale: string): string {
  const seconds = Math.round(totalSeconds);
  const unit = (value: number, name: "minute" | "second") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(
      value,
    );

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return unit(rest, "second");
  return rest === 0
    ? unit(minutes, "minute")
    : `${unit(minutes, "minute")} ${unit(rest, "second")}`;
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
