export default function CleaningPage() {
  const summary = {
    total: 23,
    managers: ["주보민(회장)", "강지우(부회장)", "이시원(부회장)"],
    excluded: {
      chalkboard: ["김은솔", "송민주", "심지안"],
      trash: ["윤혜림", "이승지", "현서정", "박민석"],
    },
    specialZones: [
      { zone: "AI교실", name: "김태현" },
      { zone: "AI교실", name: "김혜민" },
      { zone: "AI교실", name: "박우진" },
      { zone: "AI교실", name: "손정연" },
      { zone: "AI교실", name: "유다현" },
      { zone: "AI교실", name: "이조은" },
    ],
    classroomFront: ["김하연", "성연준", "양효승"],
    classroomBack: ["장지현", "정은지", "최안아", "전주하"],
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 shadow-sm">
        <div className="text-sm font-medium text-sky-600">2학년 2반 학급 운영</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          🧹 우리반 청소 역할표
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          월요일, 목요일 청소 기준 역할표입니다. 회장/부회장은 청소를 총괄하고,
          칠판 담당과 쓰레기 담당은 일반 청소에서 제외됩니다.
          홀수 번호 중 6명은 특별구역을 담당하고, 나머지 학생들은 교실 청소를 맡습니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-rose-600">청소 총괄</div>
          <div className="mt-3 space-y-2">
            {summary.managers.map((name) => (
              <div
                key={name}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-amber-700">청소 제외 · 칠판 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.excluded.chalkboard.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-violet-700">청소 제외 · 쓰레기 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.excluded.trash.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <h2 className="text-xl font-bold text-gray-900">특별구역 담당</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summary.specialZones.map((item) => (
            <div
              key={item.zone}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"
            >
              <div className="text-sm font-semibold text-emerald-700">{item.zone}</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{item.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">월요일 청소</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-sky-700">교실 · 쓸기</div>
              <div className="flex flex-wrap gap-2">
                {summary.classroomFront.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-rose-700">교실 · 닦기</div>
              <div className="flex flex-wrap gap-2">
                {summary.classroomBack.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-emerald-700">특별구역</div>
              <div className="flex flex-wrap gap-2">
                {summary.specialZones.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">목요일 청소</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-sky-700">교실 · 닦기</div>
              <div className="flex flex-wrap gap-2">
                {summary.classroomFront.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-rose-700">교실 · 쓸기</div>
              <div className="flex flex-wrap gap-2">
                {summary.classroomBack.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-emerald-700">특별구역</div>
              <div className="flex flex-wrap gap-2">
                {summary.specialZones.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">전체 역할 한눈에 보기</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  구분
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  담당
                </th>
                <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  비고
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  청소 총괄
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  주보민, 강지우, 이시원
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">
                  회장/부회장
                </td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  칠판 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  김은솔, 송민주, 심지안
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">
                  청소 제외
                </td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  쓰레기 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  윤혜림, 이승지, 현서정, 박민석
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">
                  청소 제외
                </td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  특별구역
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  김태현, 김혜민, 박우진, 손정연, 유다현, 이조은
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">
                  홀수 번호 중 6명
                </td>
              </tr>

              <tr className="align-top">
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                  교실 청소
                </td>
                <td className="px-4 py-4 text-sm text-gray-800">
                  김하연, 성연준, 양효승, 장지현, 정은지, 최안아, 전주하
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  월/목 쓸기·닦기 교대
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}