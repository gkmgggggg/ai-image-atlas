import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Grid3X3,
  Image as ImageIcon,
  Search,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import './styles.css';

const base = import.meta.env.BASE_URL;

function App() {
  const [payload, setPayload] = useState(null);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [showOnlyImages, setShowOnlyImages] = useState(true);
  const [selected, setSelected] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetch(`${base}gallery-data.json`)
      .then((response) => response.json())
      .then(setPayload)
      .catch((error) => {
        console.error('Failed to load gallery data', error);
      });
  }, []);

  const categories = payload?.stats.categories ?? [];
  const items = payload?.items ?? [];

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      if (showOnlyImages && !item.hasImage) return false;
      if (activeCategory !== '全部' && item.category !== activeCategory) return false;
      if (!keyword) return true;
      return item.searchText.includes(keyword);
    });
  }, [activeCategory, items, query, showOnlyImages]);

  const featured = useMemo(() => filteredItems.slice(0, 9), [filteredItems]);

  function openRandom() {
    const withImages = filteredItems.filter((item) => item.hasImage);
    const pool = withImages.length > 0 ? withImages : filteredItems;
    if (pool.length === 0) return;
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  }

  async function copyPrompt(item) {
    await navigator.clipboard.writeText(item.promptCopy || item.promptZh || item.prompt);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <main>
      <section className="workspace">
        <aside className="rail">
          <a className="brand" href={base} aria-label="AI 图集首页">
            <span className="brandMark"><Sparkles size={22} /></span>
            <span>
              <strong>AI 图集</strong>
              <small>Prompt Atlas</small>
            </span>
          </a>

          <div className="statStack" aria-label="图集统计">
            <Stat value={payload?.stats.withImage ?? '...'} label="有图案例" />
            <Stat value={payload?.stats.total ?? '...'} label="提示词" />
            <Stat value={categories.length || '...'} label="分类" />
          </div>

          <div className="sourceBox">
            <span>来源</span>
            <a href={payload?.upstream.url ?? 'https://github.com/wukongnotnull/image-inspirer'} target="_blank" rel="noreferrer">
              image-inspirer <ExternalLink size={14} />
            </a>
            <small>{payload?.upstream.license ?? 'Apache-2.0'} · {payload?.upstream.commit ?? 'main'}</small>
          </div>
        </aside>

        <section className="canvas">
          <header className="topbar">
            <div className="titleBlock">
              <p>从图片反查提示词</p>
              <h1>把好看的 AI 图片案例，整理成可搜索的灵感墙。</h1>
            </div>

            <div className="actions">
              <button className="iconButton" type="button" onClick={openRandom} title="随机打开一个案例" aria-label="随机打开一个案例">
                <Shuffle size={18} />
              </button>
              <a className="sourceLink" href="https://github.com/wukongnotnull/image-inspirer" target="_blank" rel="noreferrer">
                <ArrowUpRight size={18} />
                上游仓库
              </a>
            </div>
          </header>

          <section className="controlBand" aria-label="筛选">
            <label className="searchBox">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索风格、题材、作者或提示词"
              />
            </label>

            <button
              className={`toggleButton ${showOnlyImages ? 'isActive' : ''}`}
              type="button"
              onClick={() => setShowOnlyImages((value) => !value)}
              aria-pressed={showOnlyImages}
            >
              <ImageIcon size={18} />
              仅有图
            </button>
          </section>

          <nav className="categoryStrip" aria-label="分类">
            <CategoryButton
              name="全部"
              count={payload?.stats.withImage ?? 0}
              active={activeCategory === '全部'}
              onClick={() => setActiveCategory('全部')}
            />
            {categories.map((category) => (
              <CategoryButton
                key={category.name}
                name={category.name}
                count={showOnlyImages ? category.withImage : category.total}
                active={activeCategory === category.name}
                onClick={() => setActiveCategory(category.name)}
              />
            ))}
          </nav>

          <section className="resultMeta" aria-live="polite">
            <span><Grid3X3 size={16} /> {filteredItems.length} 个结果</span>
            <span>{activeCategory}</span>
          </section>

          {payload ? (
            <Gallery items={featured.length > 0 ? filteredItems : []} onOpen={setSelected} />
          ) : (
            <LoadingGrid />
          )}
        </section>
      </section>

      {selected && (
        <CaseDialog
          item={selected}
          copied={copiedId === selected.id}
          onClose={() => setSelected(null)}
          onCopy={() => copyPrompt(selected)}
        />
      )}
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CategoryButton({ name, count, active, onClick }) {
  return (
    <button className={`categoryButton ${active ? 'isActive' : ''}`} type="button" onClick={onClick}>
      <span>{name}</span>
      <strong>{count}</strong>
    </button>
  );
}

function Gallery({ items, onOpen }) {
  if (items.length === 0) {
    return (
      <section className="emptyState">
        <Search size={32} />
        <h2>没有匹配案例</h2>
        <p>换一个关键词，或关闭“仅有图”。</p>
      </section>
    );
  }

  return (
    <section className="gallery" aria-label="AI 图集">
      {items.map((item) => (
        <button
          className="caseCard"
          type="button"
          key={`${item.category}-${item.id}`}
          onClick={() => onOpen(item)}
          aria-label={`打开案例 ${item.id}：${item.title}`}
        >
          <div className="imageFrame">
            {item.hasImage ? (
              <img loading="lazy" src={`${base}${item.image}`} alt={`案例 ${item.id}：${item.title}`} />
            ) : (
              <div className="missingImage"><ImageIcon size={24} /> 无本地图</div>
            )}
          </div>
          <div className="cardBody">
            <span>{item.category}</span>
            <h2>{item.title}</h2>
            <p>{item.prompt}</p>
          </div>
        </button>
      ))}
    </section>
  );
}

function LoadingGrid() {
  return (
    <section className="gallery" aria-label="加载中">
      {Array.from({ length: 12 }).map((_, index) => (
        <div className="caseCard skeleton" key={index}>
          <div className="imageFrame" />
          <div className="cardBody">
            <span />
            <h2 />
            <p />
          </div>
        </div>
      ))}
    </section>
  );
}

function CaseDialog({ item, copied, onClose, onCopy }) {
  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  return (
    <div className="dialogBackdrop" role="presentation" onMouseDown={onClose}>
      <article className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="closeButton" type="button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>

        <div className="dialogMedia">
          {item.hasImage ? (
            <img src={`${base}${item.image}`} alt={`案例 ${item.id}：${item.title}`} />
          ) : (
            <div className="missingImage"><ImageIcon size={28} /> 这个案例暂未包含图片文件</div>
          )}
        </div>

        <div className="dialogCopy">
          <div className="caseEyebrow">
            <span>Case {item.id}</span>
            <span>{item.category}</span>
          </div>
          <h2 id="dialog-title">{item.title}</h2>
          <p className="sourceText">来源：{item.source}</p>

          <div className="promptToolbar">
            <span>{item.promptLength.toLocaleString('zh-CN')} 字符</span>
            <button type="button" onClick={onCopy}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? '已复制' : item.promptZh ? '复制中文提示词' : '复制提示词'}
            </button>
          </div>

          <pre>{item.prompt}</pre>
        </div>
      </article>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
