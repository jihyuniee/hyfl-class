import type { Metadata } from 'next';
import SeoulAdmissions from './SeoulAdmissions';

export const metadata: Metadata = {
  title: '2028 대입 탐색기 | 한영외고 2-2',
  description: '서울 소재 대학과 2028 정시 반영방법, 학년도별 과거 정시 입결을 확인합니다.',
};

export default async function SeoulAdmissionsPage({ searchParams }: {
  searchParams: Promise<{ university?: string; section?: string; q?: string; year?: string }>;
}) {
  const { university, section, q, year } = await searchParams;
  return <SeoulAdmissions key={`${university || ""}/${q || ""}/${section || ""}/${year || ""}`} initialUniversity={university} initialQuery={q} initialSection={section} initialYear={year} />;
}
