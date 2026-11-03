import type { Metadata } from "next";
import AdmissionsHome from "@/components/admissions/AdmissionsHome";

export const metadata: Metadata = {
  title: "대입 탐색 | 2-2 우리반",
  description: "궁금한 질문에서 시작하는 대입 탐색. 대학·학과 검색, 공개 정시 입결, 2028 수시 전형과 공식 자료를 확인합니다.",
};

export default function AdmissionsPage() {
  return <AdmissionsHome />;
}
