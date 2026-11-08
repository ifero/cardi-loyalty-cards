// Shared helpers for the watch Swift-source suites. Not a `*.test.ts` file, so Jest
// treats it as a module rather than a suite.
//
// The watch targets ship Swift that CI compiles but never *runs*: there is no test
// action for `watch-ios/Tests/`. Two suites therefore lift declarations out of the
// shipped source and run them as a standalone program — the symbology contract
// (Story 16.28) for the encoders, and the layout contract (Story 16.27) for the
// barcode geometry. The slicing and the `xcrun swift` plumbing live here rather than
// being copied into each file.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Index of the first `signature` occurrence that is REAL CODE — not one inside a `//` or block
 * comment.
 *
 * A plain `indexOf` cannot tell the two apart, and this repository quotes code fragments inside doc
 * comments constantly. A comment that happens to carry a declaration's signature therefore shadows
 * the declaration itself: the slice starts inside the prose, the brace/bracket walk balances on the
 * comment's own delimiters, and the suite validates the QUOTE while the real code below it goes
 * untested — green on a file it never read. Found by the Story 16.41 QA review, which built exactly
 * that decoy and showed the harness reporting `#1A73E8` while the shipped code returned `#000000`.
 */
const codeIndexOf = (source: string, signature: string) => {
  let inString = false;

  for (let i = 0; i < source.length; i += 1) {
    if (!inString) {
      if (source.startsWith('//', i)) {
        const newline = source.indexOf('\n', i);

        if (newline === -1) {
          return -1;
        }

        i = newline;
        continue;
      }

      // ⚠️ NESTING-AWARE, because Swift's block comments nest. `indexOf('*/')` finds the FIRST
      // terminator, so in `/* a /* b */ c */` it would treat `c` as live code — and a declaration
      // planted there would be returned as the match while the compiler saw only a comment.
      if (source.startsWith('/*', i)) {
        let depth = 1;
        let j = i + 2;

        while (j < source.length && depth > 0) {
          if (source.startsWith('/*', j)) {
            depth += 1;
            j += 2;
          } else if (source.startsWith('*/', j)) {
            depth -= 1;
            j += 2;
          } else {
            j += 1;
          }
        }

        if (depth > 0) {
          return -1;
        }

        i = j - 1;
        continue;
      }

      if (source.startsWith(signature, i)) {
        return i;
      }
    }

    // An EVEN run of preceding backslashes means this quote is real; an odd run means it is
    // escaped. A one-character lookback cannot tell `\\"` (escaped backslash, then a real closing
    // quote) from `\"` (an escaped quote), and gets stuck inside a string for the rest of the file.
    if (source[i] === '"') {
      let backslashes = 0;

      for (let k = i - 1; k >= 0 && source[k] === '\\'; k -= 1) {
        backslashes += 1;
      }

      if (backslashes % 2 === 0) {
        inString = !inString;
      }
    }
  }

  return -1;
};

/**
 * `source` with its comments removed.
 *
 * Assertions that a construct is ABSENT have to read code only: the watch sources' comments quote
 * the modifiers and calls they explain, so a naive `not.toContain` would match the prose rather
 * than the code and pass, or fail, for the wrong reason.
 */
export const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/**
 * Slice a Swift declaration out of `source`, brace/bracket-matched.
 *
 * Anchors on the signature's OWN trailing delimiter: `[String] = [` contains an
 * earlier `[` belonging to the type annotation, not to the array literal.
 *
 * `label` names the file in failures — extraction throwing is the point, because it
 * fails loudly and names the declaration it could not find rather than silently
 * testing less than it claims.
 */
export const swiftDeclaration = (source: string, signature: string, label: string) => {
  const start = codeIndexOf(source, signature);

  if (start === -1) {
    throw new Error(`Unable to find "${signature}" in ${label} (outside comments)`);
  }

  const open = signature.trimEnd().endsWith('[') ? '[' : '{';
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;

  for (let i = start + signature.length - 1; i < source.length; i += 1) {
    const character = source[i];

    // ⚠️ Deliberately NOT the parity-based escape check `codeIndexOf` uses above — the asymmetry is
    // a scope decision, not an oversight. This one-character lookback predates Story 16.41 and is
    // shared with the 16.26/16.27/16.37 suites; its failure mode is a loud `Unbalanced delimiters`
    // throw rather than a silent wrong answer, and no current source triggers it. Change it only
    // with those three suites in hand.
    if (character === '"' && source[i - 1] !== '\\') {
      inString = !inString;
    }

    if (inString) {
      continue;
    }

    // Skip comments: a brace or bracket written in prose must not move the depth.
    if (character === '/' && source[i + 1] === '/') {
      const newline = source.indexOf('\n', i);

      if (newline === -1) {
        break;
      }

      i = newline;
      continue;
    }

    if (character === '/' && source[i + 1] === '*') {
      const commentEnd = source.indexOf('*/', i + 2);

      if (commentEnd === -1) {
        break;
      }

      i = commentEnd + 1;
      continue;
    }

    if (character === open) {
      depth += 1;
    } else if (character === close) {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new Error(`Unbalanced delimiters while slicing "${signature}"`);
};

/** Body of a `switch <subject> { ... }` inside the named function. */
export const switchBody = (
  source: string,
  funcSignature: string,
  label: string,
  subject = 'format'
) => {
  // Comment-aware for the same reason `swiftDeclaration` is: a signature quoted in prose above the
  // real function would anchor the slice inside the comment.
  const start = codeIndexOf(source, funcSignature);

  if (start === -1) {
    throw new Error(`Unable to find ${funcSignature} in ${label} (outside comments)`);
  }

  const open = source.indexOf(`switch ${subject} {`, start);
  const close = source.indexOf('\n    }', open);

  return source.slice(open, close);
};

/**
 * Compile and run `program` as a standalone Swift file, feeding it `input` on stdin
 * and returning its stdout.
 *
 * `label` names the source the program was lifted from, and `hint` explains what a
 * failure means for that suite — a trap here is a crash on real card data, not a
 * cosmetic test failure, and the raw output buries that under ~40 lines of LLVM
 * stack dump.
 */
export const runSwiftProgram = ({
  program,
  input,
  label,
  hint
}: {
  program: string;
  input: string;
  label: string;
  hint: string;
}) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-swift-'));
  const file = path.join(directory, 'Harness.swift');

  try {
    fs.writeFileSync(file, program);

    try {
      return execFileSync('xcrun', ['--sdk', 'macosx', 'swift', file], {
        input,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024
      });
    } catch (error) {
      const output = String(
        (error as { stderr?: Buffer | string }).stderr ?? (error as Error).message
      );
      const diagnosis = output
        .split('\n')
        .filter((line) => /Fatal error|error:|warning:/.test(line))
        .slice(0, 8)
        .join('\n');

      // Swift's line number refers to the assembled harness, which is deleted below
      // and does not share the real file's numbering. Quote the line itself, so the
      // offending code is greppable in the real source.
      const harnessLine = Number(output.match(/Harness\.swift:(\d+)/)?.[1]);
      const culprit = Number.isFinite(harnessLine)
        ? `\n\nThat line, lifted verbatim from ${label} (grep for it there — the number ` +
          `above is harness-relative):\n    ${program.split('\n')[harnessLine - 1]?.trim()}`
        : '';

      throw new Error(
        `The declarations lifted from ${label} failed to run. ${hint}\n\n` +
          `${diagnosis || output.slice(0, 600)}${culprit}`
      );
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

/** `describe` on macOS, `describe.skip` elsewhere — `xcrun` is macOS-only. */
export const describeOnMac = process.platform === 'darwin' ? describe : describe.skip;
