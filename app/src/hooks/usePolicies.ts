// Policy editor hooks: the player's drafts (kept in this browser) and live checks of a draft.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { SAMPLE_DRAFTS, TEMPLATE_YAML } from "../data/policies";
import { checkPolicy, hashPolicyText } from "../model/policyCheck";
import type { PolicyCheck, PolicyDraft, PolicyTemplate } from "../types/policy";

const DRAFTS_STORAGE_KEY = "moirai.policyDrafts";

/** Reads saved drafts, falling back to the sample drafts (storage can be blocked or empty). */
function loadDrafts(): PolicyDraft[] {
  try {
    const saved = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as PolicyDraft[];
    }
  } catch {
    // Unreadable or blocked storage: start from the samples.
  }
  return [...SAMPLE_DRAFTS];
}

function saveDrafts(drafts: readonly PolicyDraft[]): void {
  try {
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Private windows can block storage; drafts then last for this visit only.
  }
}

/** The player's drafts, which one is open, and ways to change them. */
export type PolicyDrafts = {
  drafts: PolicyDraft[];
  current: PolicyDraft;
  select: (id: string) => void;
  updateCurrentYaml: (yaml: string) => void;
  /** Adds a draft (from a template, or blank) and opens it. */
  create: (template: PolicyTemplate | null, name: string) => void;
};

/** Policy drafts saved in this browser (never sent anywhere until the player commits one). */
export function usePolicyDrafts(): PolicyDrafts {
  const [drafts, setDrafts] = useState<PolicyDraft[]>(loadDrafts);
  const [currentId, setCurrentId] = useState<string>(() => drafts[0]?.id ?? "");

  const replaceDrafts = useCallback((next: PolicyDraft[]) => {
    setDrafts(next);
    saveDrafts(next);
  }, []);

  const current = drafts.find((draft) => draft.id === currentId) ?? drafts[0] ?? SAMPLE_DRAFTS[0];

  const updateCurrentYaml = useCallback(
    (yaml: string) => {
      replaceDrafts(drafts.map((draft) => (draft.id === current?.id ? { ...draft, yaml } : draft)));
    },
    [drafts, current, replaceDrafts],
  );

  const create = useCallback(
    (template: PolicyTemplate | null, name: string) => {
      const id = `${name}-${Date.now()}`;
      const yaml = template === null ? `name: ${name}\nrules:\n  - if: always\n    do: claim_tile(nearest_deposit)\n` : TEMPLATE_YAML[template];
      replaceDrafts([{ id, name, yaml, matches: 0, wins: 0 }, ...drafts]);
      setCurrentId(id);
    },
    [drafts, replaceDrafts],
  );

  return {
    drafts,
    current: current as PolicyDraft,
    select: setCurrentId,
    updateCurrentYaml,
    create,
  };
}

/** Live checks of a draft (rules, errors, warnings) plus its hash. */
export type PolicyDraftReport = {
  check: PolicyCheck;
  hash: UseQueryResult<string>;
  sizeBytes: number;
};

/** Checks the YAML on every edit and hashes it. */
export function usePolicyCheck(yaml: string): PolicyDraftReport {
  const check = useMemo(() => checkPolicy(yaml), [yaml]);
  const sizeBytes = useMemo(() => new TextEncoder().encode(yaml).length, [yaml]);
  const hash = useQuery({
    queryKey: ["policyHash", yaml],
    queryFn: () => hashPolicyText(yaml),
    staleTime: Infinity,
  });
  return { check, hash, sizeBytes };
}
