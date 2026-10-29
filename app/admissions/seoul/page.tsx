import type { Metadata } from "next";
import SeoulAdmissions from "./SeoulAdmissions";

export const metadata: Metadata = {
  title: "서울 주요대학 입시 참고자료 | 한영외고 2-2",
  description: "인문·사회·어문계열의 과거 정시 입결과 2028학년도 반영방식을 출처와 함께 확인합니다.",
};

export default async function SeoulAdmissionsPage({ searchParams }: { searchParams: Promise<{ university?: string }> }) {
  const { university } = await searchParams;
  return <SeoulAdmissions initialUniversity={university || ""} />;
}
