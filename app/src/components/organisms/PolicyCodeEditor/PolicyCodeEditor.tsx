// PolicyCodeEditor organism: an editable YAML box with line numbers, syntax colours and warning
// highlights. It is a real <textarea> (typing, selecting, screen readers all work) laid exactly
// over a coloured copy of the same text; the textarea's own text is transparent, so you see the
// colours underneath and the caret on top.

import type { ChangeEvent, ReactElement } from "react";
import { highlightYamlLine } from "../../../model/yamlHighlight";
import { CodeLayer, Editor, FileTab, Frame, Gutter, LineRow, LineText, TokenSpan, TypingLayer } from "./PolicyCodeEditor.styles";

type PolicyCodeEditorProps = {
  id: string;
  /** Accessible name of the text box, e.g. "Policy YAML". */
  label: string;
  fileName: string;
  value: string;
  onChange: (value: string) => void;
  /** 1-based lines to highlight as warnings. */
  warningLines: readonly number[];
};

/** A YAML editor with highlighting. */
export function PolicyCodeEditor({ id, label, fileName, value, onChange, warningLines }: PolicyCodeEditorProps): ReactElement {
  const lines = value.split("\n");
  return (
    <Frame>
      <FileTab>{fileName}</FileTab>
      <Editor>
        <CodeLayer aria-hidden="true">
          {lines.map((line, index) => (
            <LineRow key={index} $isWarning={warningLines.includes(index + 1)}>
              <Gutter>{index + 1}</Gutter>
              <LineText>
                {highlightYamlLine(line).map((token, tokenIndex) => (
                  <TokenSpan key={tokenIndex} $kind={token.kind}>
                    {token.text}
                  </TokenSpan>
                ))}
                {line === "" && " "}
              </LineText>
            </LineRow>
          ))}
        </CodeLayer>
        <TypingLayer
          id={id}
          aria-label={label}
          value={value}
          rows={lines.length}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        />
      </Editor>
    </Frame>
  );
}
