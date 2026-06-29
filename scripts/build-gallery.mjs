import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const imageOutDir = path.join(publicDir, 'gallery-images');
const upstreamUrl = 'https://github.com/wukongnotnull/image-inspirer';

const sourceDir = resolveSourceDir();
const dbDir = path.join(sourceDir, 'db');

if (!existsSync(dbDir)) {
  throw new Error(`Cannot find image-inspirer db directory at ${dbDir}`);
}

rmSync(imageOutDir, { recursive: true, force: true });
mkdirSync(imageOutDir, { recursive: true });
copyUpstreamLicense(sourceDir);

const categories = readdirSync(dbDir)
  .filter((name) => statSync(path.join(dbDir, name)).isDirectory())
  .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

const items = [];
const categoryStats = new Map();

for (const category of categories) {
  const promptPath = path.join(dbDir, category, 'prompt.md');
  if (!existsSync(promptPath)) continue;

  const markdown = readFileSync(promptPath, 'utf8');
  const cases = parseCases(markdown, category);
  const categoryStat = { name: category, total: cases.length, withImage: 0 };

  for (const item of cases) {
    const sourceImagePath = path.join(dbDir, category, 'images', `case${item.id}.jpg`);
    item.sourceUrl = `${upstreamUrl}/tree/main/db/${encodeURIComponent(category)}`;
    item.upstreamImage = `${upstreamUrl}/blob/main/db/${encodeURIComponent(category)}/images/case${item.id}.jpg`;

    if (existsSync(sourceImagePath)) {
      const fileName = `case-${String(item.id).padStart(3, '0')}.jpg`;
      copyFileSync(sourceImagePath, path.join(imageOutDir, fileName));
      item.image = `gallery-images/${fileName}`;
      item.hasImage = true;
      categoryStat.withImage += 1;
    } else {
      item.image = '';
      item.hasImage = false;
    }

    items.push(item);
  }

  categoryStats.set(category, categoryStat);
}

items.sort((a, b) => a.id - b.id);

const payload = {
  generatedAt: new Date().toISOString(),
  upstream: {
    name: 'wukongnotnull/image-inspirer',
    url: upstreamUrl,
    commit: getCommit(sourceDir),
    license: 'Apache-2.0',
  },
  stats: {
    total: items.length,
    withImage: items.filter((item) => item.hasImage).length,
    categories: [...categoryStats.values()],
  },
  items,
};

writeFileSync(path.join(publicDir, 'gallery-data.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated ${payload.stats.total} cases, ${payload.stats.withImage} with local images.`);

function resolveSourceDir() {
  const explicit = process.env.IMAGE_INSPIRER_DIR;
  const candidates = [
    explicit && path.resolve(explicit),
    path.resolve(root, '..', 'image-inspirer'),
    path.join(root, '.cache', 'image-inspirer'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'db'))) return candidate;
  }

  const cacheDir = path.join(root, '.cache');
  const cloneDir = path.join(cacheDir, 'image-inspirer');
  mkdirSync(cacheDir, { recursive: true });
  execFileSync('git', ['clone', '--depth', '1', upstreamUrl, cloneDir], { stdio: 'inherit' });
  return cloneDir;
}

function parseCases(markdown, category) {
  const headingRe = /^## 例 (\d+)：(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRe.exec(markdown))) {
    headings.push({
      index: match.index,
      id: Number(match[1]),
      title: match[2].trim(),
    });
  }

  return headings.map((heading, index) => {
    const next = headings[index + 1]?.index ?? markdown.length;
    const block = markdown.slice(heading.index, next);
    const source = matchLine(block, /\*\*来源：\*\*\s*(.+)/) || '未标注';
    const imageName = matchLine(block, /!\[(case\d+\.jpg)\]\(images\/case\d+\.jpg\)/) || `case${heading.id}.jpg`;
    const prompt = extractPrompt(block);

    return {
      id: heading.id,
      title: heading.title,
      category,
      source: cleanMarkdown(source),
      sourceRaw: source,
      imageName,
      prompt,
      promptLength: prompt.length,
      searchText: `${heading.title} ${category} ${source} ${prompt}`.toLowerCase(),
    };
  });
}

function extractPrompt(block) {
  const codeMatch = block.match(/```(?:text|json)?\s*([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();

  return block
    .split('\n')
    .filter((line) => !line.startsWith('## ') && !line.startsWith('**来源') && !line.startsWith('![') && line.trim() !== '---')
    .join('\n')
    .trim();
}

function matchLine(value, re) {
  const match = value.match(re);
  return match?.[1]?.trim();
}

function cleanMarkdown(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\_/g, '_')
    .trim();
}

function getCommit(repoDir) {
  try {
    return execFileSync('git', ['-C', repoDir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function copyUpstreamLicense(repoDir) {
  const licensePath = path.join(repoDir, 'LICENSE');
  if (existsSync(licensePath)) {
    copyFileSync(licensePath, path.join(publicDir, 'UPSTREAM_LICENSE.txt'));
  }
}
