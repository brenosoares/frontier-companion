import { SORT_KEYS, type SortKey } from "./item-list";

/** Everything the catalog UI lets the user change. It lives in the URL so views are shareable. */
export interface ExplorerState {
  query: string;
  tag: string | null;
  sort: SortKey;
  showUnavailable: boolean;
}

export const DEFAULT_EXPLORER_STATE: ExplorerState = {
  query: "",
  tag: null,
  sort: "name",
  showUnavailable: false,
};

const MAX_QUERY_LENGTH = 100;

const isSortKey = (value: string | null): value is SortKey =>
  value !== null && (SORT_KEYS as readonly string[]).includes(value);

/** URL params are untrusted input: unknown values fall back to defaults and the query is capped. */
export function parseExplorerState(params: Pick<URLSearchParams, "get">): ExplorerState {
  const sort = params.get("sort");
  const tag = params.get("tag");

  return {
    query: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    tag: tag ? tag : null,
    sort: isSortKey(sort) ? sort : DEFAULT_EXPLORER_STATE.sort,
    showUnavailable: params.get("unavailable") === "1",
  };
}

/** Only non-default values are written, keeping URLs short. */
export function serializeExplorerState(state: ExplorerState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.tag) params.set("tag", state.tag);
  if (state.sort !== DEFAULT_EXPLORER_STATE.sort) params.set("sort", state.sort);
  if (state.showUnavailable) params.set("unavailable", "1");
  return params.toString();
}

export function isDefaultState(state: ExplorerState): boolean {
  return serializeExplorerState(state) === "";
}
