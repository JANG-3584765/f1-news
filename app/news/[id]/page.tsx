'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '../news.css';
import './news_detail.css';

type NewsItem = {
  id: string | number;
  title: string;
  summary: string;
  image?: string;
  source?: string;
  pubDate?: string;
  tags?: string[];
  sourceClass?: string;
  cardType?: 'analysis' | 'short';
};

const STATIC_JSON_URL = '/news.json';

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

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? '');

  const [list, setList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(STATIC_JSON_URL, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: NewsItem[]) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const item = useMemo(() => {
    return list.find(n => String(n.id) === id);
  }, [list, id]);

  if (loading) {
    return (
      <main className="detail-wrapper">
        <button className="back-btn" onClick={() => router.back()}>
          ← 뒤로가기
        </button>
        <p>불러오는 중...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="detail-wrapper">
        <button className="back-btn" onClick={() => router.back()}>
          ← 뒤로가기
        </button>
        <p>기사를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="detail-wrapper">
      <button className="back-btn" onClick={() => router.back()}>
        ← 뒤로가기
      </button>

      <article className="detail-article">
        <h1 className="detail-title">{item.title}</h1>

        <div className="detail-meta">
          {item.source ?? ''} {item.pubDate ? `· ${formatDate(item.pubDate)}` : ''}
        </div>

        {item.image ? <img src={item.image} alt="" /> : null}

        <div className="detail-summary">{item.summary ?? ''}</div>
      </article>
    </main>
  );
}
