import type { Metadata } from 'next';
import NativeAdmissionsExplorer from '@/components/admissions/NativeAdmissionsExplorer';

export const metadata: Metadata = {
  title: '2028 대입 탐색기 | 한영외고 2-2',
  description: '서울 소재 대학·전형·반영 방식과 과거 입결을 출처·검증 상태와 함께 확인합니다.',
};

export default async function SeoulAdmissionsPage({ searchParams }: {
  searchParams: Promise<{ university?: string; section?: string }>;
}) {
  const { university, section } = await searchParams;
  return <NativeAdmissionsExplorer university={university} section={section} />;
}
