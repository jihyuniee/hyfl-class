import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2028 대입 탐색기 | 한영외고 2-2',
  description: '서울 소재 대학·전형·반영 방식과 과거 입결을 출처·검증 상태와 함께 확인합니다.',
};

export default async function SeoulAdmissionsPage({ searchParams }: {
  searchParams: Promise<{ university?: string; section?: string }>;
}) {
  const { university, section } = await searchParams;
  const query = new URLSearchParams();
  if (university) query.set('university', university);
  const anchor = section === 'mock-score' ? '#mock-score' : '';
  return <iframe
    src={`/admissions-2028-explorer/index.html?${query.toString()}${anchor}`}
    title="2028 대입 탐색기 · 성적 입력과 근거 자료 비교"
    style={{ width: '100%', height: 'calc(100dvh - 64px)', minHeight: 740, border: 0, display: 'block' }}
    referrerPolicy="no-referrer"
  />;
}
