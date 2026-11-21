import type { Metadata } from "next";
import AdmissionsHome from "@/components/admissions/AdmissionsHome";
import results from "@/public/admissions-seoul/results.json";

export const metadata: Metadata = {
  title: "대입 탐색기 | 2-2 우리반",
  description: "대학·학과와 2028 수시·정시 시행계획, 학년도별 과거 정시 입결을 찾아봅니다.",
};

const uniqueUnits = new Map(results.map(({ univ, dept }) => [JSON.stringify([univ, dept]), { univ, dept }]));

export default function AdmissionsPage() {
  return <AdmissionsHome historicalUnits={[...uniqueUnits.values()]} />;
}
