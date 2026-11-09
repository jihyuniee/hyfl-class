import type { Metadata } from "next";
import AdmissionsHome from "@/components/admissions/AdmissionsHome";

export const metadata: Metadata = {
  title: "2028 대학별 시행계획 | 2-2 우리반",
  description: "대학별 시행계획 검색기에서 2028학년도 대학입학전형 시행계획을 확인합니다.",
};

export default function AdmissionsPage() {
  return <AdmissionsHome />;
}
