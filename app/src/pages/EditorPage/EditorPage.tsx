// Policy editor page ("/editor"): the player's policies, the YAML editor (or a rules view), live
// checks and the reference of conditions and actions. Design artboard "Policy editor".

import { useState } from "react";
import type { ReactElement } from "react";
import { Button, Heading, Icon, Surface, Text } from "../../components/atoms";
import { ChoiceCard, PanelHeader, SegmentedControl, StatCard } from "../../components/molecules";
import { PolicyCodeEditor } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { usePolicyCheck, usePolicyDrafts } from "../../hooks";
import { useI18nContext } from "../../i18n";
import type { TranslationFunctions } from "../../i18n";
import { KNOWN_ACTIONS, KNOWN_CONDITIONS, MAX_RULES_PER_POLICY } from "../../model/policyCheck";
import { groupHash } from "../../model/format";
import { lobbyPath, paths } from "../../routes/paths";
import { SAMPLE_LOBBIES } from "../../data/lobbies";
import type { PolicyProblem } from "../../types/policy";
import { POLICY_TEMPLATES } from "../../types/policy";
import { Check, CheckList, Chip, ChipRow, Notice, PolicyList, RuleItem, RuleList, StatGrid, TemplateRow } from "./EditorPage.styles";

/** A problem as a sentence. */
function problemText(problem: PolicyProblem, LL: TranslationFunctions): string {
  const text = LL.policies.editor.problems;
  switch (problem.kind) {
    case "noRules":
      return text.noRules();
    case "missingDo":
      return text.missingDo({ rule: problem.rule, line: problem.line });
    case "unknownCondition":
      return text.unknownCondition({ line: problem.line, word: problem.word });
    case "unknownAction":
      return text.unknownAction({ line: problem.line, word: problem.word });
    case "tooManyRules":
      return text.tooManyRules({ count: problem.count, max: problem.max });
    case "shadowed":
      return text.shadowed({ line: problem.line, rule: problem.rule, alwaysRule: problem.alwaysRule });
  }
}

/** Route screen for "/editor". */
export function EditorPage(): ReactElement {
  const { LL } = useI18nContext();
  const policies = usePolicyDrafts();
  const report = usePolicyCheck(policies.current.yaml);
  const [view, setView] = useState<"yaml" | "rules">("yaml");
  const { check } = report;
  const hasKnownWords = !check.errors.some((error) => error.kind === "unknownCondition" || error.kind === "unknownAction");

  return (
    <PageContainer width="wide" gap="md">
      <Columns
        sideSize="sm"
        start={
          <>
            <PanelHeader
              title={LL.policies.editor.myPolicies()}
              id="my-policies"
              size="card"
              aside={
                <Button
                  variant="subtle"
                  size="icon"
                  ariaLabel={LL.policies.editor.newPolicy()}
                  onClick={() => policies.create(null, LL.policies.editor.untitled())}
                >
                  <Icon name="plus" />
                </Button>
              }
            />
            <PolicyList aria-labelledby="my-policies">
              {policies.drafts.map((draft) => (
                <li key={draft.id}>
                  <ChoiceCard
                    role="current"
                    title={draft.name}
                    body={
                      draft.matches === 0
                        ? LL.policies.editor.draftMeta({ count: draft.id === policies.current.id ? check.rules.length : 0 })
                        : LL.policies.editor.usedMeta({ matches: draft.matches, wins: draft.wins })
                    }
                    isSelected={draft.id === policies.current.id}
                    onSelect={() => policies.select(draft.id)}
                  />
                </li>
              ))}
            </PolicyList>
            <Heading level={3} size="eyebrow">
              {LL.policies.editor.templates()}
            </Heading>
            <TemplateRow>
              {POLICY_TEMPLATES.map((template) => (
                <Button key={template} variant="secondary" size="sm" onClick={() => policies.create(template, template)}>
                  {LL.policies.editor.template[template]()}
                </Button>
              ))}
            </TemplateRow>
          </>
        }
        main={
          <>
            <PanelHeader
              title={policies.current.name}
              level={2}
              size="h2"
              aside={
                <SegmentedControl
                  label={LL.policies.editor.view()}
                  options={[
                    { value: "yaml" as const, label: LL.policies.editor.viewYaml() },
                    { value: "rules" as const, label: LL.policies.editor.viewRules() },
                  ]}
                  value={view}
                  onChange={setView}
                />
              }
            />
            <Text size="md" tone="muted">
              {LL.policies.editor.status()}
            </Text>
            {view === "yaml" ? (
              <PolicyCodeEditor
                id="policy-yaml"
                label={LL.policies.editor.yamlLabel()}
                fileName={LL.policies.editor.fileName()}
                value={policies.current.yaml}
                onChange={policies.updateCurrentYaml}
                warningLines={check.warningLines}
              />
            ) : (
              <RuleList>
                {check.rules.map((rule) => (
                  <RuleItem key={rule.number} $isWarning={check.warningLines.includes(rule.line)}>
                    <Text as="span" tone="muted" isMono>{rule.number}</Text>
                    <Text as="span" size="sm" tone="muted">{LL.policies.editor.if()}</Text>
                    <Chip $tone="condition">{rule.condition}</Chip>
                    <Text as="span" size="sm" tone="muted">{LL.policies.editor.then()}</Text>
                    <Chip $tone="action">{rule.action ?? "—"}</Chip>
                  </RuleItem>
                ))}
              </RuleList>
            )}
            {[...check.errors, ...check.warnings].map((problem, index) => (
              <Notice key={index} role="status" $isError={check.errors.includes(problem)}>
                <Icon name="warning" />
                <span>{problemText(problem, LL)}</span>
              </Notice>
            ))}
          </>
        }
        end={
          <>
            <Surface as="section" labelledBy="compiled" padding="md">
              <Heading level={2} size="card" id="compiled">{LL.policies.editor.compiled()}</Heading>
              <StatGrid>
                <StatCard tone="raised" label={LL.policies.editor.rules()} value={LL.policies.editor.rulesValue({ count: check.rules.length, max: MAX_RULES_PER_POLICY })} />
                <StatCard tone="raised" label={LL.policies.editor.size()} value={LL.policies.editor.sizeValue({ count: report.sizeBytes })} />
              </StatGrid>
              <div>
                <Text size="sm" tone="muted">{LL.policies.editor.hash()}</Text>
                <Text size="sm" isMono>sha256 {report.hash.data === undefined ? "…" : groupHash(report.hash.data)}</Text>
                <Text size="xs" tone="muted">{LL.policies.editor.hashNote()}</Text>
              </div>
              <CheckList>
                <Check $isOk={check.rules.length > 0}>{LL.policies.editor.checks.yaml()}</Check>
                <Check $isOk={hasKnownWords}>{LL.policies.editor.checks.known()}</Check>
                <Check $isOk={check.rules.length <= MAX_RULES_PER_POLICY}>{LL.policies.editor.checks.limit({ max: MAX_RULES_PER_POLICY })}</Check>
                <Check $isOk={check.warnings.length === 0} $isWarning>
                  {check.warnings.length === 0 ? LL.policies.editor.checks.noWarnings() : LL.policies.editor.checks.warnings({ count: check.warnings.length })}
                </Check>
              </CheckList>
              <Button to={paths.simulator} isFullWidth>{LL.policies.editor.testInSimulator()}</Button>
              <Button to={lobbyPath(SAMPLE_LOBBIES[0]?.id ?? "#A41F")} variant="secondary" isFullWidth>
                {LL.policies.editor.useInLobby()}
              </Button>
            </Surface>
            <Surface as="section" labelledBy="reference" padding="md">
              <Heading level={2} size="card" id="reference">{LL.policies.editor.reference()}</Heading>
              <Text size="sm" tone="muted">{LL.policies.editor.conditions()}</Text>
              <ChipRow>
                {KNOWN_CONDITIONS.map((condition) => <Chip key={condition} $tone="condition">{condition}</Chip>)}
              </ChipRow>
              <Text size="sm" tone="muted">{LL.policies.editor.actions()}</Text>
              <ChipRow>
                {KNOWN_ACTIONS.map((action) => <Chip key={action} $tone="action">{action}</Chip>)}
              </ChipRow>
            </Surface>
          </>
        }
      />
    </PageContainer>
  );
}
