import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * The public site's allow-list (Story 18.9, decision 2; ADR-2026-11-04-001).
 *
 * `docs/` holds the landing page and the privacy policy, but also the PRD, the architecture
 * and the sprint artifacts. GitHub Pages used to publish all of it. `site-deploy.yml` now
 * publishes an explicit allow-list to cardiapp.eu, and this test is what stops the list
 * from quietly growing, and stops a published page from linking to a file that is not on it
 * (a 404 on the live site, or worse, a reason to widen the list without thinking).
 *
 * The workflow file is read as text, not parsed as YAML: `js-yaml` is only a transitive
 * dependency here, and the values live on single, clearly named lines.
 */
const repoRoot = path.resolve(__dirname, '..');
const read = (...segments: string[]): string =>
  fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');

const WORKFLOW = read('.github', 'workflows', 'site-deploy.yml');
const SITE_URL = 'https://cardiapp.eu/';
const STUBS_DIR = path.join('.github', 'pages-redirect-stubs');

const envList = (name: string): string[] => {
  const value = WORKFLOW.match(new RegExp(`^\\s+${name}: '([^']*)'$`, 'm'))?.[1];
  if (value === undefined) throw new Error(`${name} not found in site-deploy.yml`);
  return value.split(/\s+/).filter(Boolean);
};

const SITE_FILES = envList('SITE_FILES');
const SITE_OPTIONAL_FILES = envList('SITE_OPTIONAL_FILES');
const SITE_TREES = envList('SITE_TREES');
const SITE_TREE_EXCLUDE = envList('SITE_TREE_EXCLUDE');

const listTree = (relative: string): string[] =>
  fs
    .readdirSync(path.join(repoRoot, 'docs', relative), { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(path.join(repoRoot, 'docs'), path.join(entry.parentPath, entry.name))
    )
    .map((p) => p.split(path.sep).join('/'));

/** Exactly what the workflow's stage step copies, computed from the same values. */
const publishedSet = (): Set<string> => {
  const files = [...SITE_FILES, ...SITE_OPTIONAL_FILES].filter((f) =>
    fs.existsSync(path.join(repoRoot, 'docs', f))
  );
  const treeFiles = SITE_TREES.flatMap(listTree).filter(
    (p) => !SITE_TREE_EXCLUDE.includes(path.posix.basename(p))
  );
  return new Set([...files, ...treeFiles]);
};

/** Every local reference (href, src, url()) in a published text file, resolved from `docs/`. */
const localReferences = (file: string): string[] => {
  const text = read('docs', file);
  const raw = [
    ...[...text.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1] ?? ''),
    ...[...text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1] ?? '')
  ];
  return raw
    .filter((ref) => !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(ref) && ref !== '')
    .map((ref) => ref.replace(/[?#].*$/, ''))
    .map((ref) => path.posix.normalize(path.posix.join(path.posix.dirname(file), ref)));
};

/** The `run:` block of the workflow's stage step, de-indented, exactly as CI runs it. */
const stageScript = (): string => {
  const block = WORKFLOW.match(
    /- name: Stage the allow-listed files\n {8}run: \|\n([\s\S]*?)\n\n {6}- name:/
  )?.[1];
  if (block === undefined) throw new Error('Stage step not found in site-deploy.yml');
  return block
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
};

/**
 * Runs the stage step with `bash` in a fresh temp dir whose `source/` is a one-commit git repo
 * holding a copy of `docs/`. `mutate` edits that copy first. Returns the `_site/` file list.
 */
const runStage = (mutate: (docs: string) => void = () => {}): string[] => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-stage-'));
  try {
    const docs = path.join(dir, 'source', 'docs');
    fs.cpSync(path.join(repoRoot, 'docs'), docs, { recursive: true });
    mutate(docs);
    // Git hooks export GIT_DIR and friends. Inherited, they point `git init` at the real
    // repository (it once set core.bare there), so the temp repo gets an environment without them.
    const gitEnv = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))
      ),
      NODE_ENV: 'test'
    };
    const git = (...args: string[]) =>
      execFileSync('git', ['-C', path.join(dir, 'source'), ...args], {
        stdio: 'ignore',
        env: gitEnv
      });
    git('init', '-q');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 't');

    execFileSync('bash', ['-c', stageScript()], {
      cwd: dir,
      stdio: 'pipe',
      env: {
        NODE_ENV: 'test',
        PATH: process.env.PATH,
        SITE_FILES: SITE_FILES.join(' '),
        SITE_OPTIONAL_FILES: SITE_OPTIONAL_FILES.join(' '),
        SITE_TREES: SITE_TREES.join(' '),
        SITE_TREE_EXCLUDE: SITE_TREE_EXCLUDE.join(' '),
        GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md')
      }
    });

    const site = path.join(dir, '_site');
    return fs
      .readdirSync(site, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(site, path.join(entry.parentPath, entry.name)))
      .map((p) => p.split(path.sep).join('/'))
      .sort();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('public site allow-list (site-deploy.yml)', () => {
  it('publishes the pages, the stylesheet and the HTTPS redirect, and nothing else', () => {
    expect(SITE_FILES).toEqual(['index.html', 'privacy-policy.html', 'style.css']);
    expect(SITE_OPTIONAL_FILES).toEqual(['.htaccess']);
    expect(SITE_TREES).toEqual(['assets']);
    expect(SITE_TREE_EXCLUDE).toEqual(['README.md']);
  });

  it('deploys on a push that touches exactly the allow-list, the stubs or the workflow', () => {
    const pushBlock = WORKFLOW.match(/^ {2}push:\n([\s\S]*?)\n {2}workflow_dispatch:/m)?.[1];
    expect(pushBlock).toBeDefined();
    const paths = [...(pushBlock ?? '').matchAll(/^ {6}- '([^']+)'$/gm)].map((m) => m[1]);

    expect(paths.sort()).toEqual(
      [
        ...SITE_FILES.map((f) => `docs/${f}`),
        ...SITE_OPTIONAL_FILES.map((f) => `docs/${f}`),
        ...SITE_TREES.map((t) => `docs/${t}/**`),
        '.github/pages-redirect-stubs/**',
        '.github/workflows/site-deploy.yml'
      ].sort()
    );
  });

  it('rolls back by deploying the dispatched ref, while the Pages stubs never follow it', () => {
    expect(WORKFLOW).toMatch(/^ {2}workflow_dispatch:\n {4}inputs:\n {6}ref:\n/m);
    expect(WORKFLOW).toContain('ref: ${{ inputs.ref || github.sha }}');

    const pagesJob = WORKFLOW.slice(WORKFLOW.indexOf('\n  pages:\n'))
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');
    expect(pagesJob).toContain('needs: deploy');
    expect(pagesJob).not.toContain('inputs.ref');
  });

  it('keeps every required file present and leaves the private documents out', () => {
    const published = publishedSet();

    for (const f of [...SITE_FILES, ...SITE_OPTIONAL_FILES]) expect(published).toContain(f);
    for (const p of published) {
      expect(p).not.toMatch(/\.(md|ya?ml)$/i);
      expect(p).not.toMatch(/^(sprint-artifacts|design|ux-designs|analysis|store|schemas)\//);
    }
    expect(published).not.toContain('ux-design-directions.html');
    expect(published).not.toContain('help.json');
    expect(published).not.toContain('assets/screenshots/README.md');
    // The tree really is published, not silently empty.
    expect([...published].some((p) => p.startsWith('assets/'))).toBe(true);
  });

  it('stages exactly the allow-list when the workflow step runs', () => {
    expect(runStage()).toEqual([...publishedSet()].sort());
  }, 30000);

  it('fails the stage step on a symlink in an allow-listed tree', () => {
    expect(() =>
      runStage((docs) => fs.symlinkSync('../prd.md', path.join(docs, 'assets', 'leak.md')))
    ).toThrow();
  }, 30000);

  it('fails the stage step when a required file is missing', () => {
    expect(() => runStage((docs) => fs.rmSync(path.join(docs, 'style.css')))).toThrow();
  }, 30000);

  it.each(['index.html', 'privacy-policy.html', 'style.css'])(
    '%s links only to files on the allow-list',
    (file) => {
      const published = publishedSet();
      const outside = localReferences(file).filter((ref) => !published.has(ref));

      expect(outside).toEqual([]);
    }
  );

  it.each(['index.html', 'privacy-policy.html'])('%s carries no old GitHub Pages URL', (file) => {
    expect(read('docs', file)).not.toContain('github.io');
  });

  it('names cardiapp.eu as the canonical og:url', () => {
    expect(read('docs', 'index.html')).toContain(
      `<meta property="og:url" content="${SITE_URL}" />`
    );
  });

  it('redirects HTTP and www to the HTTPS apex, never the HTTPS apex itself', () => {
    const rules = read('docs', '.htaccess')
      .split('\n')
      .filter((line) => !line.trim().startsWith('#') && line.trim() !== '');

    expect(rules).toEqual([
      'RewriteEngine On',
      'RewriteCond %{HTTP_HOST} ^www\\.cardiapp\\.eu$ [NC]',
      'RewriteRule ^(.*)$ https://cardiapp.eu/$1 [R=301,L]',
      'RewriteCond %{SERVER_PORT} ^80$',
      'RewriteRule ^(.*)$ https://cardiapp.eu/$1 [R=301,L]'
    ]);
  });
});

describe('GitHub Pages redirect stubs', () => {
  const STUBS: Record<string, string> = {
    'index.html': SITE_URL,
    'privacy-policy.html': `${SITE_URL}privacy-policy.html`
  };

  it('publishes exactly the two stubs', () => {
    expect(
      fs
        .readdirSync(path.join(repoRoot, STUBS_DIR))
        .filter((name) => !name.startsWith('.'))
        .sort()
    ).toEqual(Object.keys(STUBS).sort());
  });

  it.each(Object.entries(STUBS))(
    '%s forwards to %s by refresh, canonical and plain link',
    (stub, target) => {
      const html = read(STUBS_DIR, stub);

      expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${target}" />`);
      expect(html).toContain(`<link rel="canonical" href="${target}" />`);
      expect(html).toContain(`<a href="${target}">`);
      // A stub links nowhere else: no asset, no other page on the old host.
      const otherRefs = [...html.matchAll(/\b(?:href|src|url)=["']?([^"'\s>]+)/g)]
        .map((m) => m[1])
        .filter((ref) => ref !== target);
      expect(otherRefs).toEqual([]);
    }
  );
});
