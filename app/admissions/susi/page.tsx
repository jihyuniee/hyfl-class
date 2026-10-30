import type { Metadata } from "next";
import SusiExplorer from "./SusiExplorer";

export const metadata: Metadata = { title: "수시 · 학과와 전형 | 2-2 우리반", description: "서울 대학의 학과·교육과정과 공식 출처, 2028 수시 전형방법·수능최저·면접 확인" };

export default async function SusiPage({ searchParams }: { searchParams: Promise<{ university?: string; area?: string }> }) {
  const { university, area } = await searchParams;
  return <SusiExplorer initialUniversity={university || ""} initialProfile={area || ""} />;
}
