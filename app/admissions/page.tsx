import type { Metadata } from "next";
import AdmissionsHome from "@/components/admissions/AdmissionsHome";

export const metadata: Metadata = {
  title: "대입 탐색기 | 2-2 우리반",
  description: "모의고사 점수 참고표, 계열별 학과, 학년도별 정시 입결, 2028 전형별 수능최저와 면접을 확인합니다.",
};

export default function AdmissionsPage() {
  return <AdmissionsHome />;
}
