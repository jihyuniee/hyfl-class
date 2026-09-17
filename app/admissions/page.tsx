"use client";

import { useEffect, useMemo, useState } from "react";

type AdmissionRow = {
  r: string;
  u: string;
  a: string;
  g: string;
  t: string;
  c: string;
  d: string;
  l: string;
  q: number;
  o: number;
  s: number;
  p: number;
};

type TabKey = "score" | "search" | "saved" | "guide";

type AdmissionManifest = {
  total: number;
  universities: number;
  files: string[];
};

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "score", label: "점수로 찾기", emoji: "📊" },
  { key: "search", label: "대학·학과 찾기", emoji: "🔎" },
  { key: "saved", label: "관심 목록", emoji: "♡" },
  { key: "guide", label: "전형 알아보기", emoji: "📚" },
];

const REGIONS = [
  "전체", "서울", "경기", "인천", "강원", "대전", "충남", "충북",
  "광주", "전남", "전북", "대구", "경북", "부산", "울산", "경남", "제주",
];

const TRACKS = ["전체", "인문", "자연", "공통"];

const GUIDE_CARDS = [
  {
    title: "학생부교과",
    color: "#2563eb",
    bg: "#eff6ff",
    summary: "교과 성적을 중심으로 선발하는 전형",
    checks: ["대학별 반영 교과와 학년별 비율", "학교장 추천 필요 여부와 추천 인원", "수능 최저학력기준"],
  },
  {
    title: "학생부종합",
    color: "#7c3aed",
    bg: "#f5f3ff",
    summary: "성적과 세특, 과목 선택, 탐구 과정을 함께 보는 전형",
    checks: ["지원 학과와 교과·세특의 연결", "활동의 개수보다 동기·과정·배운 점", "서류형·면접형 여부"],
  },
  {
    title: "논술",
    color: "#db2777",
    bg: "#fdf2f8",
    summary: "대학별 논술고사 성적의 비중이 큰 전형",
    checks: ["인문논술·수리논술 등 출제 유형", "수능 최저학력기준", "기출문제와 시험 일정"],
  },
  {
    title: "정시",
    color: "#059669",
    bg: "#ecfdf5",
    summary: "수능 성적을 중심으로 선발하는 전형",
    checks: ["표준점수·백분위·변환표준점수 중 반영 방식", "영역별 반영 비율과 가산점", "가·나·다군 모집단위"],
  },
];

function rowKey(row: AdmissionRow) {
  return [row.u, row.d, row.a, row.g, row.t, row.r].join("|");
}

function numberText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function ScoreCalculator({
  onApply,
}: {
  onApply: (standard: number, percentile: number) => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>({
    ks: "", ms: "", ss: "", ns: "",
    kp: "", mp: "", sp: "", np: "",
  });

  const fields = [
    { key: "k", label: "국어" },
    { key: "m", label: "수학" },
    { key: "s", label: "통합사회" },
    { key: "n", label: "통합과학" },
  ];

  const apply = () => {
    const values = Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, Number(value)])
    ) as Record<string, number>;
    if (Object.values(values).some((value) => !Number.isFinite(value))) {
      alert("8개 과목 점수를 모두 입력해 주세요.");
      return;
    }
    const standard = values.ks + values.ms + values.ss + values.ns;
    const percentile = values.kp + values.mp + (values.sp + values.np) / 2;
    onApply(standard, percentile);
  };

  return (
    <details className="ad-calculator">
      <summary>합계 계산이 어렵다면 과목별로 입력하기</summary>
      <div className="ad-calculator-body">
        <div className="ad-calc-table">
          <div className="ad-calc-head">과목</div>
          <div className="ad-calc-head">표준점수</div>
          <div className="ad-calc-head">백분위</div>
          {fields.map((field) => (
            <div className="ad-calc-row" key={field.key}>
              <label>{field.label}</label>
              <input
                type="number"
                inputMode="decimal"
                value={scores[`${field.key}s`]}
                onChange={(event) => setScores((current) => ({
                  ...current,
                  [`${field.key}s`]: event.target.value,
                }))}
                aria-label={`${field.label} 표준점수`}
              />
              <input
                type="number"
                inputMode="decimal"
                value={scores[`${field.key}p`]}
                onChange={(event) => setScores((current) => ({
                  ...current,
                  [`${field.key}p`]: event.target.value,
                }))}
                aria-label={`${field.label} 백분위`}
              />
            </div>
          ))}
        </div>
        <button type="button" className="hy-btn hy-btn-primary" onClick={apply}>
          합계 계산해서 적용
        </button>
        <p className="ad-help">
          표준점수는 네 과목을 모두 더하고, 백분위는 국어 + 수학 + 두 탐구 백분위의 평균으로 계산합니다.
        </p>
      </div>
    </details>
  );
}

function Filters({
  region,
  track,
  onRegion,
  onTrack,
}: {
  region: string;
  track: string;
  onRegion: (value: string) => void;
  onTrack: (value: string) => void;
}) {
  return (
    <div className="ad-filters">
      <label>
        <span>지역</span>
        <select value={region} onChange={(event) => onRegion(event.target.value)}>
          {REGIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <span>계열</span>
        <select value={track} onChange={(event) => onTrack(event.target.value)}>
          {TRACKS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
    </div>
  );
}

function ResultCard({
  row,
  favorite,
  onToggle,
  studentStandard,
  studentPercentile,
}: {
  row: AdmissionRow;
  favorite: boolean;
  onToggle: () => void;
  studentStandard?: number;
  studentPercentile?: number;
}) {
  const hasStudentScore = studentStandard != null && studentPercentile != null;

  return (
    <article className="ad-result-card">
      <div className="ad-result-main">
        <div className="ad-result-top">
          <div>
            <div className="ad-chips">
              <span>{row.r}</span>
              <span>{row.t}</span>
              <span>{row.g}군</span>
              {row.c && <span>{row.c}</span>}
            </div>
            <h3>{row.u}</h3>
            <p className="ad-department">{row.d}</p>
          </div>
          <button
            type="button"
            className={`ad-heart ${favorite ? "is-saved" : ""}`}
            onClick={onToggle}
            aria-label={favorite ? "관심 목록에서 삭제" : "관심 목록에 저장"}
            title={favorite ? "관심 목록에서 삭제" : "관심 목록에 저장"}
          >
            {favorite ? "♥" : "♡"}
          </button>
        </div>
        <p className="ad-meta">
          {row.a} · 모집인원 {row.q}명
        </p>
      </div>
      <div className="ad-cutline">
        <p>지원 참고 점수</p>
        <div>
          <span><b>{numberText(row.s)}</b> 표준</span>
          <span><b>{numberText(row.p)}</b> 백분위</span>
        </div>
        {hasStudentScore && (
          <small>
            내 점수 여유: 표준 +{numberText(studentStandard - row.s)} · 백분위 +{numberText(studentPercentile - row.p)}
          </small>
        )}
      </div>
    </article>
  );
}

function ResultList({
  rows,
  favorites,
  onToggle,
  visibleCount,
  onMore,
  emptyText,
  studentStandard,
  studentPercentile,
}: {
  rows: AdmissionRow[];
  favorites: Set<string>;
  onToggle: (row: AdmissionRow) => void;
  visibleCount: number;
  onMore: () => void;
  emptyText: string;
  studentStandard?: number;
  studentPercentile?: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="ad-empty">
        <span>🔎</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="ad-results">
        {rows.slice(0, visibleCount).map((row, index) => (
          <ResultCard
            key={`${rowKey(row)}-${index}`}
            row={row}
            favorite={favorites.has(rowKey(row))}
            onToggle={() => onToggle(row)}
            studentStandard={studentStandard}
            studentPercentile={studentPercentile}
          />
        ))}
      </div>
      {visibleCount < rows.length && (
        <button type="button" className="hy-btn ad-more" onClick={onMore}>
          더 보기 ({Math.min(visibleCount + 40, rows.length)} / {rows.length})
        </button>
      )}
    </>
  );
}

export default function AdmissionsPage() {
  const [rows, setRows] = useState<AdmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<TabKey>("score");
  const [standardInput, setStandardInput] = useState("");
  const [percentileInput, setPercentileInput] = useState("");
  const [scoreSearched, setScoreSearched] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("전체");
  const [track, setTrack] = useState("전체");
  const [visibleCount, setVisibleCount] = useState(40);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);

  useEffect(() => {
    fetch("/admissions-data/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("data load failed");
        return response.json();
      })
      .then((manifest: AdmissionManifest) => Promise.all(
        manifest.files.map((filename) => fetch(`/admissions-data/${filename}`).then((response) => {
          if (!response.ok) throw new Error("data chunk load failed");
          return response.json() as Promise<AdmissionRow[]>;
        }))
      ))
      .then((chunks) => setRows(chunks.flat()))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const readHash = () => {
      const value = window.location.hash.replace("#", "") as TabKey;
      if (TABS.some((item) => item.key === value)) setTab(value);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hyfl-admission-favorites") ?? "[]");
      if (Array.isArray(saved)) setFavorites(new Set(saved));
    } catch {
      setFavorites(new Set());
    } finally {
      setFavoritesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    localStorage.setItem("hyfl-admission-favorites", JSON.stringify([...favorites]));
  }, [favorites, favoritesReady]);

  useEffect(() => {
    setVisibleCount(40);
  }, [tab, keyword, region, track, standardInput, percentileInput]);

  const studentStandard = Number(standardInput);
  const studentPercentile = Number(percentileInput);
  const validScore = Number.isFinite(studentStandard)
    && Number.isFinite(studentPercentile)
    && studentStandard > 0
    && studentStandard <= 440
    && studentPercentile > 0
    && studentPercentile <= 300;

  const filteredBase = useMemo(() => rows.filter((row) => (
    (region === "전체" || row.r === region)
    && (track === "전체" || row.t === track)
  )), [rows, region, track]);

  const scoreResults = useMemo(() => {
    if (!scoreSearched || !validScore) return [];
    return filteredBase
      .filter((row) => row.s <= studentStandard && row.p <= studentPercentile)
      .sort((a, b) => b.s - a.s || b.p - a.p || a.u.localeCompare(b.u, "ko"));
  }, [filteredBase, scoreSearched, studentStandard, studentPercentile, validScore]);

  const searchResults = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("ko");
    if (!query) return [];
    return filteredBase
      .filter((row) => [row.u, row.d, row.c, row.a].some((value) => (
        value.toLocaleLowerCase("ko").includes(query)
      )))
      .sort((a, b) => a.u.localeCompare(b.u, "ko") || b.s - a.s || a.d.localeCompare(b.d, "ko"));
  }, [filteredBase, keyword]);

  const savedRows = useMemo(() => rows
    .filter((row) => favorites.has(rowKey(row)))
    .sort((a, b) => a.u.localeCompare(b.u, "ko") || a.d.localeCompare(b.d, "ko")),
  [rows, favorites]);

  const toggleFavorite = (row: AdmissionRow) => {
    const key = rowKey(row);
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectTab = (nextTab: TabKey) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `#${nextTab}`);
  };

  const searchByScore = () => {
    if (!validScore) {
      alert("표준점수 합계는 1~440, 백분위 합계는 1~300 사이로 입력해 주세요.");
      return;
    }
    setScoreSearched(true);
  };

  return (
    <div className="ad-page">
      <section className="hy-hero ad-hero">
        <div>
          <span className="ad-hero-tag">2026 한영외고 2-2</span>
          <h1>🎓 대학 입시 탐색</h1>
          <p>내 점수로 지원 가능 대학을 살펴보고, 관심 대학과 전형 정보를 한곳에서 확인해요.</p>
        </div>
        <div className="ad-hero-stat">
          <b>179</b>
          <span>대학</span>
          <i />
          <b>4,109</b>
          <span>모집단위</span>
        </div>
      </section>

      <div className="ad-warning">
        <span>📌</span>
        <p>
          이 결과는 <b>이투스 2027학년도 9월 학력평가 지원참고표(고1 가채점)</b> 기준의 탐색 자료입니다.
          실제 합격 가능성은 대학별 환산 방식, 수능 영역별 반영 비율, 모집인원과 경쟁률에 따라 달라집니다.
        </p>
      </div>

      <nav className="ad-tabs" aria-label="대학 입시 메뉴">
        {TABS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={tab === item.key ? "is-active" : ""}
            onClick={() => selectTab(item.key)}
          >
            <span>{item.emoji}</span>
            {item.label}
            {item.key === "saved" && favorites.size > 0 && <b>{favorites.size}</b>}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="ad-loading">
          <div />
          <p>대학 정보를 불러오고 있어요.</p>
        </div>
      )}

      {loadError && (
        <div className="ad-empty">
          <span>⚠️</span>
          <p>대학 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        </div>
      )}

      {!loading && !loadError && tab === "score" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>MY SCORE</p>
              <h2>내 점수로 지원 가능 대학 찾기</h2>
            </div>
            <span>입력한 점수는 저장되지 않아요 🔒</span>
          </div>

          <div className="ad-score-panel">
            <div className="ad-score-inputs">
              <label>
                <span>표준점수 합계</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="440"
                  placeholder="예: 385"
                  value={standardInput}
                  onChange={(event) => {
                    setStandardInput(event.target.value);
                    setScoreSearched(false);
                  }}
                />
                <small>국어 + 수학 + 통합사회 + 통합과학</small>
              </label>
              <label>
                <span>백분위 합계</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="300"
                  placeholder="예: 270"
                  value={percentileInput}
                  onChange={(event) => {
                    setPercentileInput(event.target.value);
                    setScoreSearched(false);
                  }}
                />
                <small>국어 + 수학 + 탐구 2과목 평균</small>
              </label>
              <button type="button" className="hy-btn hy-btn-primary ad-search-button" onClick={searchByScore}>
                지원 가능 대학 검색
              </button>
            </div>
            <ScoreCalculator onApply={(standard, percentile) => {
              setStandardInput(numberText(standard));
              setPercentileInput(numberText(percentile));
              setScoreSearched(false);
            }} />
          </div>

          {scoreSearched && validScore && (
            <>
              <div className="ad-result-header">
                <div>
                  <h3>검색 결과 <b>{scoreResults.length.toLocaleString()}개</b></h3>
                  <p>표준점수와 백분위 참고점수를 모두 충족한 모집단위입니다.</p>
                </div>
                <Filters region={region} track={track} onRegion={setRegion} onTrack={setTrack} />
              </div>
              <ResultList
                rows={scoreResults}
                favorites={favorites}
                onToggle={toggleFavorite}
                visibleCount={visibleCount}
                onMore={() => setVisibleCount((count) => count + 40)}
                emptyText="두 점수를 모두 충족하는 모집단위가 없습니다. 점수 합계와 필터를 다시 확인해 주세요."
                studentStandard={studentStandard}
                studentPercentile={studentPercentile}
              />
            </>
          )}

          {!scoreSearched && (
            <div className="ad-tip-grid">
              <div><span>1</span><p><b>성적표 확인</b>과목별 표준점수와 백분위를 확인해요.</p></div>
              <div><span>2</span><p><b>합계 입력</b>직접 더하거나 과목별 계산 도움을 이용해요.</p></div>
              <div><span>3</span><p><b>결과 탐색</b>대학·학과를 살펴보고 관심 목록에 저장해요.</p></div>
            </div>
          )}
        </section>
      )}

      {!loading && !loadError && tab === "search" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>UNIVERSITY & MAJOR</p>
              <h2>관심 대학·학과 찾아보기</h2>
            </div>
            <span>대학명, 학과명, 계열명으로 검색할 수 있어요.</span>
          </div>
          <div className="ad-keyword-panel">
            <div className="ad-keyword-input">
              <span>🔎</span>
              <input
                type="search"
                placeholder="예: 한국외대, 경영학과, 국제학…"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                autoFocus
              />
              {keyword && <button type="button" onClick={() => setKeyword("")} aria-label="검색어 지우기">×</button>}
            </div>
            <Filters region={region} track={track} onRegion={setRegion} onTrack={setTrack} />
          </div>

          {keyword.trim() ? (
            <>
              <div className="ad-result-header">
                <div>
                  <h3>검색 결과 <b>{searchResults.length.toLocaleString()}개</b></h3>
                  <p>관심 항목의 참고점수와 모집 정보를 비교해 보세요.</p>
                </div>
              </div>
              <ResultList
                rows={searchResults}
                favorites={favorites}
                onToggle={toggleFavorite}
                visibleCount={visibleCount}
                onMore={() => setVisibleCount((count) => count + 40)}
                emptyText="검색 조건과 일치하는 대학이나 학과가 없습니다. 다른 검색어를 입력해 주세요."
              />
            </>
          ) : (
            <div className="ad-empty ad-search-empty">
              <span>🏫</span>
              <p>관심 있는 대학이나 학과 이름을 입력해 보세요.</p>
              <small>179개 대학, 4,109개 모집단위를 검색할 수 있습니다.</small>
            </div>
          )}
        </section>
      )}

      {!loading && !loadError && tab === "saved" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>MY INTERESTS</p>
              <h2>관심 대학·학과</h2>
            </div>
            <span>이 기기의 브라우저에만 저장됩니다.</span>
          </div>
          <ResultList
            rows={savedRows}
            favorites={favorites}
            onToggle={toggleFavorite}
            visibleCount={visibleCount}
            onMore={() => setVisibleCount((count) => count + 40)}
            emptyText="아직 저장한 대학이나 학과가 없습니다. 검색 결과의 하트를 눌러 관심 목록을 만들어 보세요."
          />
        </section>
      )}

      {!loading && !loadError && tab === "guide" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>ADMISSION GUIDE</p>
              <h2>대입 전형 한눈에 이해하기</h2>
            </div>
            <span>전형은 대학과 학년도에 따라 달라질 수 있어요.</span>
          </div>

          <div className="ad-guide-grid">
            {GUIDE_CARDS.map((card) => (
              <article key={card.title} className="ad-guide-card" style={{ background: card.bg, borderColor: `${card.color}33` }}>
                <h3 style={{ color: card.color }}>{card.title}</h3>
                <p>{card.summary}</p>
                <ul>
                  {card.checks.map((check) => <li key={check}>{check}</li>)}
                </ul>
              </article>
            ))}
          </div>

          <div className="ad-foreign-card">
            <div>
              <span>🌏</span>
              <h3>외고 학생이 함께 살펴볼 것</h3>
            </div>
            <ul>
              <li><b>국어·영어·수학의 기본 학업 역량</b>과 지원 학과에 필요한 교과 성취</li>
              <li><b>전공어·사회·탐구 과목의 세특</b>이 관심 분야와 어떻게 이어지는지</li>
              <li>활동을 많이 나열하기보다 <b>동기 → 탐구 과정 → 결과와 배운 점</b>이 드러나는지</li>
              <li>대학 이름만 보지 말고 <b>학과 교육과정과 졸업 후 진로</b>가 나와 맞는지</li>
            </ul>
          </div>

          <div className="ad-check-order">
            <h3>대학 정보는 이 순서로 확인해요</h3>
            <div>
              <a href="https://www.adiga.kr" target="_blank" rel="noreferrer">
                <span>1</span><b>대입정보포털 어디가</b><small>대학·학과·전형 비교</small>
              </a>
              <div className="ad-order-arrow">→</div>
              <div>
                <span>2</span><b>대학 입학처</b><small>해당 학년도 모집요강 확인</small>
              </div>
              <div className="ad-order-arrow">→</div>
              <div>
                <span>3</span><b>학교 진학 상담</b><small>내 학생부와 성적을 함께 점검</small>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="ad-source">
        자료: 이투스 2027학년도 9월 학력평가 대학별 지원참고표(고1 가채점) · 교내 진학 탐색용
      </footer>

      <style>{`
        .ad-page { display:flex; flex-direction:column; gap:20px; }
        .ad-hero { display:flex; align-items:center; justify-content:space-between; gap:24px; }
        .ad-hero-tag { display:inline-flex; padding:4px 13px; border-radius:999px; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.35); color:#fff; font-size:12px; font-weight:800; margin-bottom:12px; }
        .ad-hero h1 { color:#fff; font-size:clamp(24px,4vw,34px); font-weight:900; margin:0 0 8px; letter-spacing:-.04em; }
        .ad-hero p { color:rgba(255,255,255,.88); font-size:14px; font-weight:600; line-height:1.7; margin:0; max-width:620px; }
        .ad-hero-stat { display:grid; grid-template-columns:auto auto; gap:2px 8px; min-width:190px; padding:18px 20px; border-radius:22px; background:rgba(255,255,255,.17); border:1px solid rgba(255,255,255,.3); color:#fff; backdrop-filter:blur(8px); }
        .ad-hero-stat b { font-size:24px; line-height:1; font-weight:900; text-align:right; }
        .ad-hero-stat span { font-size:12px; font-weight:700; align-self:end; }
        .ad-hero-stat i { grid-column:1/-1; height:1px; background:rgba(255,255,255,.25); margin:6px 0; }
        .ad-warning { display:flex; gap:11px; padding:14px 18px; border-radius:16px; border:1.5px solid #fcd34d; background:#fffbeb; align-items:flex-start; }
        .ad-warning > span { font-size:18px; }
        .ad-warning p { margin:0; font-size:12px; line-height:1.75; color:#78550b; }
        .ad-tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:7px; border-radius:18px; background:#fff; border:1.5px solid var(--border); box-shadow:var(--shadow-sm); }
        .ad-tabs button { position:relative; border:0; border-radius:13px; padding:11px 12px; background:transparent; color:var(--text-muted); font:700 13px inherit; cursor:pointer; transition:.16s ease; }
        .ad-tabs button span { margin-right:5px; }
        .ad-tabs button b { display:inline-flex; justify-content:center; align-items:center; min-width:18px; height:18px; padding:0 5px; margin-left:5px; border-radius:999px; background:#f472b6; color:#fff; font-size:10px; }
        .ad-tabs button.is-active { color:#fff; background:linear-gradient(135deg,#f472b6,#a78bfa); box-shadow:0 4px 13px rgba(244,114,182,.28); }
        .ad-tabs button.is-active b { background:rgba(255,255,255,.28); }
        .ad-section { display:flex; flex-direction:column; gap:18px; }
        .ad-section-title { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding:6px 2px 0; }
        .ad-section-title p { margin:0 0 4px; color:var(--primary); font-size:10px; font-weight:900; letter-spacing:.12em; }
        .ad-section-title h2 { margin:0; color:var(--text); font-size:21px; font-weight:900; letter-spacing:-.04em; }
        .ad-section-title > span { color:var(--text-subtle); font-size:11px; font-weight:600; }
        .ad-score-panel, .ad-keyword-panel { padding:22px; border-radius:22px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); }
        .ad-score-inputs { display:grid; grid-template-columns:1fr 1fr auto; gap:12px; align-items:end; }
        .ad-score-inputs label > span, .ad-filters label > span { display:block; margin:0 0 7px; color:var(--text-muted); font-size:12px; font-weight:800; }
        .ad-score-inputs input { width:100%; box-sizing:border-box; padding:13px 14px; border-radius:13px; border:1.5px solid var(--border); color:var(--text); background:#fdfbff; outline:none; font:800 17px inherit; }
        .ad-score-inputs input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(244,114,182,.12); }
        .ad-score-inputs small { display:block; margin-top:6px; color:var(--text-subtle); font-size:10px; }
        .ad-search-button { height:48px; white-space:nowrap; margin-bottom:20px; }
        .ad-calculator { margin-top:16px; border-top:1px dashed var(--border); padding-top:14px; }
        .ad-calculator summary { color:var(--primary-dark); font-size:12px; font-weight:800; cursor:pointer; }
        .ad-calculator-body { margin-top:14px; padding:16px; border-radius:16px; background:linear-gradient(135deg,#fdf2f8,#f5f3ff); }
        .ad-calc-table { display:grid; grid-template-columns:minmax(72px,.8fr) 1fr 1fr; gap:7px; margin-bottom:12px; }
        .ad-calc-head { color:var(--text-subtle); font-size:10px; font-weight:800; text-align:center; }
        .ad-calc-row { display:contents; }
        .ad-calc-row label { align-self:center; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-calc-row input { min-width:0; padding:9px 10px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--text); font:700 14px inherit; outline:none; }
        .ad-help { margin:10px 0 0; color:var(--text-subtle); font-size:10px; line-height:1.6; }
        .ad-tip-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .ad-tip-grid > div { display:flex; align-items:center; gap:11px; padding:15px 16px; border-radius:17px; border:1.5px solid var(--border); background:#fff; }
        .ad-tip-grid span { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:10px; flex:0 0 auto; color:#fff; background:linear-gradient(135deg,#f472b6,#a78bfa); font-size:12px; font-weight:900; }
        .ad-tip-grid p { margin:0; color:var(--text-muted); font-size:11px; line-height:1.45; }
        .ad-tip-grid b { display:block; color:var(--text); font-size:12px; margin-bottom:2px; }
        .ad-result-header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-top:5px; }
        .ad-result-header h3 { margin:0 0 3px; font-size:16px; color:var(--text); }
        .ad-result-header h3 b { color:var(--primary-dark); }
        .ad-result-header p { margin:0; color:var(--text-subtle); font-size:11px; }
        .ad-filters { display:flex; gap:8px; }
        .ad-filters label > span { display:inline; margin-right:5px; font-size:10px; }
        .ad-filters select { padding:8px 30px 8px 11px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--text-muted); font:700 11px inherit; outline:none; }
        .ad-results { display:flex; flex-direction:column; gap:9px; }
        .ad-result-card { display:grid; grid-template-columns:minmax(0,1fr) 245px; border-radius:19px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); overflow:hidden; transition:.18s ease; }
        .ad-result-card:hover { transform:translateY(-2px); border-color:#f9a8d4; box-shadow:var(--shadow-md); }
        .ad-result-main { padding:16px 18px; }
        .ad-result-top { display:flex; justify-content:space-between; gap:12px; }
        .ad-chips { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:7px; }
        .ad-chips span { padding:3px 8px; border-radius:999px; background:#f5f3ff; color:#7c3aed; font-size:9px; font-weight:800; }
        .ad-result-card h3 { margin:0 0 2px; color:var(--text); font-size:16px; font-weight:900; }
        .ad-department { margin:0; color:var(--text-muted); font-size:13px; font-weight:700; }
        .ad-meta { margin:9px 0 0; color:var(--text-subtle); font-size:10px; }
        .ad-heart { width:38px; height:38px; border-radius:12px; border:1px solid var(--border); background:#fff; color:#f9a8d4; cursor:pointer; font-size:22px; line-height:1; flex:0 0 auto; }
        .ad-heart:hover, .ad-heart.is-saved { border-color:#f9a8d4; color:#ec4899; background:#fdf2f8; }
        .ad-cutline { display:flex; flex-direction:column; justify-content:center; padding:15px 17px; border-left:1px dashed #ddd6fe; background:linear-gradient(135deg,#faf5ff,#fdf2f8); }
        .ad-cutline > p { margin:0 0 6px; color:var(--text-subtle); font-size:9px; font-weight:800; letter-spacing:.06em; }
        .ad-cutline > div { display:flex; gap:9px; }
        .ad-cutline > div span { color:var(--text-muted); font-size:10px; }
        .ad-cutline b { color:var(--text); font-size:17px; }
        .ad-cutline small { margin-top:7px; color:#059669; font-size:9px; font-weight:700; }
        .ad-more { align-self:center; min-width:190px; }
        .ad-empty { padding:46px 22px; border-radius:20px; border:1.5px dashed var(--border); background:#fff; text-align:center; }
        .ad-empty > span { display:block; font-size:34px; margin-bottom:8px; }
        .ad-empty p { margin:0; color:var(--text-muted); font-size:13px; font-weight:700; line-height:1.6; }
        .ad-empty small { display:block; margin-top:6px; color:var(--text-subtle); font-size:11px; }
        .ad-loading { display:flex; align-items:center; justify-content:center; gap:10px; min-height:190px; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-loading div { width:20px; height:20px; border-radius:50%; border:3px solid #fce7f3; border-top-color:var(--primary); animation:adSpin .8s linear infinite; }
        .ad-keyword-panel { display:flex; gap:12px; align-items:center; }
        .ad-keyword-input { display:flex; align-items:center; gap:8px; flex:1; padding:3px 12px; border-radius:14px; border:1.5px solid var(--border); background:#fdfbff; }
        .ad-keyword-input input { min-width:0; flex:1; border:0; padding:10px 0; outline:none; background:transparent; color:var(--text); font:700 14px inherit; }
        .ad-keyword-input button { border:0; background:transparent; color:var(--text-subtle); font-size:20px; cursor:pointer; }
        .ad-search-empty { min-height:170px; display:flex; flex-direction:column; justify-content:center; }
        .ad-guide-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:11px; }
        .ad-guide-card { padding:20px; border-radius:20px; border:1.5px solid; }
        .ad-guide-card h3 { margin:0 0 5px; font-size:17px; font-weight:900; }
        .ad-guide-card > p { margin:0 0 12px; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-guide-card ul { display:flex; flex-direction:column; gap:6px; padding:0; margin:0; list-style:none; }
        .ad-guide-card li { position:relative; padding-left:14px; color:var(--text-muted); font-size:11px; line-height:1.5; }
        .ad-guide-card li::before { content:'✓'; position:absolute; left:0; color:#10b981; font-weight:900; }
        .ad-foreign-card { padding:22px; border-radius:22px; border:1.5px solid #bae6fd; background:linear-gradient(135deg,#f0f9ff,#eff6ff); }
        .ad-foreign-card > div { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .ad-foreign-card > div span { font-size:23px; }
        .ad-foreign-card h3 { margin:0; color:#075985; font-size:16px; font-weight:900; }
        .ad-foreign-card ul { display:grid; grid-template-columns:1fr 1fr; gap:8px 22px; margin:0; padding-left:18px; }
        .ad-foreign-card li { color:#486579; font-size:11px; line-height:1.65; }
        .ad-check-order { padding:22px; border-radius:22px; border:1.5px solid var(--border); background:#fff; }
        .ad-check-order h3 { margin:0 0 15px; font-size:15px; font-weight:900; }
        .ad-check-order > div { display:flex; align-items:stretch; gap:10px; }
        .ad-check-order a, .ad-check-order > div > div:not(.ad-order-arrow) { flex:1; display:grid; grid-template-columns:28px 1fr; gap:1px 8px; padding:13px; border-radius:15px; border:1px solid var(--border); background:#fdfbff; text-decoration:none; }
        .ad-check-order span { grid-row:1/3; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:9px; background:var(--primary-light); color:var(--primary-dark); font-size:11px; font-weight:900; }
        .ad-check-order b { color:var(--text); font-size:12px; }
        .ad-check-order small { color:var(--text-subtle); font-size:9px; }
        .ad-order-arrow { align-self:center; color:#c4b5fd; font-weight:900; }
        .ad-source { padding:7px 0; color:var(--text-subtle); font-size:10px; text-align:center; }
        @keyframes adSpin { to { transform:rotate(360deg); } }
        @media (max-width:760px) {
          .ad-hero { align-items:flex-start; flex-direction:column; }
          .ad-hero-stat { width:100%; box-sizing:border-box; grid-template-columns:auto auto 1px auto auto; align-items:center; }
          .ad-hero-stat b { text-align:right; }
          .ad-hero-stat i { grid-column:auto; width:1px; height:34px; margin:0 8px; }
          .ad-tabs { grid-template-columns:repeat(2,1fr); }
          .ad-section-title { align-items:flex-start; flex-direction:column; gap:5px; }
          .ad-score-inputs { grid-template-columns:1fr 1fr; }
          .ad-search-button { grid-column:1/-1; width:100%; margin:2px 0 0; }
          .ad-tip-grid { grid-template-columns:1fr; }
          .ad-result-header { align-items:flex-start; flex-direction:column; }
          .ad-result-card { grid-template-columns:1fr; }
          .ad-cutline { border-left:0; border-top:1px dashed #ddd6fe; }
          .ad-keyword-panel { align-items:stretch; flex-direction:column; }
          .ad-filters { width:100%; }
          .ad-filters label { flex:1; }
          .ad-filters select { width:100%; }
          .ad-guide-grid { grid-template-columns:1fr; }
          .ad-foreign-card ul { grid-template-columns:1fr; }
          .ad-check-order > div { flex-direction:column; }
          .ad-order-arrow { transform:rotate(90deg); }
        }
        @media (max-width:430px) {
          .ad-score-inputs { grid-template-columns:1fr; }
          .ad-search-button { grid-column:auto; }
          .ad-tabs button { font-size:12px; padding:10px 6px; }
        }
      `}</style>
    </div>
  );
}
