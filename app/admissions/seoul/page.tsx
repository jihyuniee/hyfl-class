import type { Metadata } from 'next';
import SeoulAdmissions from './SeoulAdmissions';

export const metadata: Metadata = {
  title: '2028 대입 탐색기 | 한영외고 2-2',
  description: '모의고사 표점합·평균 백분위로 기존 지원참고표를 구간별로 보고, 2028 반영방법과 과거 입결을 확인합니다.',
};

export default async function SeoulAdmissionsPage({ searchParams }: {
  searchParams: Promise<{ university?: string; section?: string; q?: string }>;
}) {
  const { university, section, q } = await searchParams;
  return <SeoulAdmissions initialUniversity={university} initialQuery={q} initialSection={section} />;
}
