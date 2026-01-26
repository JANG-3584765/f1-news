'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import './news.css';

type Category = 'all' | 'team' | 'driver' | 'tech' | 'reg' | 'rumor';
type SourceFilter = 'all' | 'official' | 'media' | 'reporter' | 'rumor';

type NewsItem = {
  id: string | number;
  title: string;
  summary: string;
  image?: string;
  source?: string;
  pubDate?: string;
  tags?: string[];
  sourceClass?: 'official' | 'media' | 'reporter' | 'rumor';
  cardType?: 'analysis' | 'short';
};

const STATIC_JSON_URL = '/news.json';
const PAGE_SIZE = 10;

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function makeBadges(tags?: string[], sourceClass?: string) {
  const tagBadges = (tags ?? [])
    .slice(0, 2)
    .map(t => `<span class="badge">${t}</span>`)
    .join(' ');
  const sc = sourceClass ?? 'media';
  return `${tagBadges} <span class="badge">${sc}</span>`;
}

export default function NewsPage() {
  const router = useRouter();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [page, setPage] = useState(0);

  const CATEGORY_TABS: { label: string; value: Category }[] = [
    { label: '전체', value: 'all' },
    { label: '팀', value: 'team' },
    { label: '드라이버', value: 'driver' },
    { label: '기술', value: 'tech' },
    { label: '규정', value: 'reg' },
    { label: '루머', value: 'rumor' },
  ];

  // 데이터 로드
  useEffect(() => {
    fetch(STATIC_JSON_URL)
      .then(res => res.json())
      .then((data: NewsItem[]) => {
        console.log('NEWS DATA:', data);
        setNews(Array.isArray(data) ? data : []);
      })
      .catch(() => setNews([]));
  }, []);

  // 필터 + 최신순 정렬
  const filtered = useMemo(() => {
    let list = [...news];

    if (category !== 'all') {
      list = list.filter(n => n.tags?.includes(category));
    }

    if (source !== 'all') {
      list = list.filter(n => (n.sourceClass ?? 'media') === source);
    }

    // 최신순
    list.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [news, category, source]);

  // 무한 스크롤
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setPage(p => p + 1);
      }
    });

    if (bottomRef.current) io.observe(bottomRef.current);
    return () => io.disconnect();
  }, []);

  const visible = filtered.slice(0, (page + 1) * PAGE_SIZE);

  return (
    <main id="news-main">
      {/* 카테고리 탭 */}
      <nav className="news-category-tabs">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.value}
            className={category === tab.value ? 'active' : ''}
            onClick={() => {
              setCategory(tab.value);
              setPage(0);
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 소스 필터 */}
      <section className="news-source-filter">
        <select
          id="newsSourceFilter"
          value={source}
          onChange={e => {
            setSource(e.target.value as SourceFilter);
            setPage(0);
          }}
        >
          <option value="all">전체 소스</option>
          <option value="official">공식</option>
          <option value="media">전문매체</option>
          <option value="reporter">기자</option>
          <option value="rumor">루머</option>
        </select>
      </section>

      {/* 리스트 */}
      <section className="news-list">
        {visible.map(item => {
          const cardType = item.cardType ?? 'short';
          const id = String(item.id);
          const sourceClass = item.sourceClass ?? 'media';

          if (cardType === 'analysis') {
            return (
              <article
                key={id}
                className="news-card analysis"
                data-id={id}
                onClick={() => router.push(`/news/${encodeURIComponent(id)}`)}
              >
                <div className="meta-row">
                  <div
                    className="badges"
                    dangerouslySetInnerHTML={{
                      __html: makeBadges(item.tags, sourceClass),
                    }}
                  />
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                    {item.source ?? ''} {item.pubDate ? `· ${formatDate(item.pubDate)}` : ''}
                  </div>
                </div>

                {item.image ? <img src={item.image} alt="" /> : null}

                <div className="card-title">{item.title}</div>
                <div className="card-summary">{item.summary ?? ''}</div>
              </article>
            );
          }

          // short
          return (
            <article
              key={id}
              className="news-card short"
              data-id={id}
              onClick={() => router.push(`/news/${encodeURIComponent(id)}`)}
            >
              {item.image ? <img className="thumb" src={item.image} alt="" /> : <div className="thumb" />}
              <div className="short-body">
                <div className="s-title">{item.title}</div>
                <div className="s-text">{item.summary ?? ''}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
                  {item.source ?? ''} {item.pubDate ? `· ${formatDate(item.pubDate)}` : ''}
                </div>
              </div>
            </article>
          );
        })}

        <div ref={bottomRef} />
      </section>
    </main>
  );
}
