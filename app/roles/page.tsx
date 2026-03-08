export default function RolesFixedPage() {
  const sections = [
    {
      dept: "자치기획부",
      emoji: "👑",
      roles: [
        {
          role: "학급 회장",
          students: ["주보민"],
          desc: "배려와 열정이 가득한 학급이 될 수 있도록 노력하고, 학급 일을 총괄 관리",
        },
        {
          role: "학급 부회장 A",
          students: ["강지우"],
          desc: "회장과 함께 학급 의견을 수합하고 담임에게 전달",
        },
        {
          role: "학급 부회장 B",
          students: ["이시원"],
          desc: "각 교과 선생님과 학급 친구들 사이의 연결 역할",
        },
      ],
    },
    {
      dept: "행정안전부",
      emoji: "🗂️",
      roles: [
        {
          role: "독서활동 관리자",
          students: ["김태현"],
          desc: "추천 도서 관리 및 독서 활동 운영",
        },
        {
          role: "게시판 관리자",
          students: ["최인아"],
          desc: "학급 게시판 관리 / 칠판 메모 / 동기부여 글귀 정리",
        },
        {
          role: "기록물 관리자",
          students: ["김혜민"],
          desc: "출석부 관리 / 학급 문서 수합 / 학급 회의 시 서기 역할",
        },
      ],
    },
    {
      dept: "소통환경부",
      emoji: "🌿",
      roles: [
        {
          role: "배치 관리자",
          students: ["유다현", "손정연"],
          desc: "자리 배치 및 조 편성 관리",
        },
        {
          role: "교실환경 관리자",
          students: ["박우진"],
          desc: "청소 및 교실 환경 점검",
        },
        {
          role: "에너지 관리자",
          students: ["장지현"],
          desc: "냉난방 / 전등 / 문단속 관리",
        },
        {
          role: "이벤트 관리자",
          students: ["전주하"],
          desc: "학급 분위기 조성 캠페인 기획",
        },
      ],
    },
    {
      dept: "교육성장부",
      emoji: "📘",
      roles: [
        {
          role: "쪽지시험 관리자",
          students: ["양효승", "김하연"],
          desc: "조회 시간 단어시험 및 학급 쪽지시험 운영",
        },
        {
          role: "멀티미디어 관리자",
          students: ["성연준"],
          desc: "컴퓨터 및 정보기기 관리 / 학급 멀티미디어 운영",
        },
      ],
    },
    {
      dept: "문화체육부",
      emoji: "🎬",
      roles: [
        {
          role: "영상-사진 관리자",
          students: ["이조은"],
          desc: "학급 단체사진 기획 / 학급 추억 영상 촬영",
        },
      ],
    },
  ];

  const extraRoles = [
    {
      role: "급식",
      students: ["정은지"],
      desc: "급식 관련 전달 및 간단한 정리",
    },
    {
      role: "쓰레기",
      students: ["윤혜림", "이승지", "현서정", "박민석"],
      desc: "분리수거 및 쓰레기 정리 담당",
    },
    {
      role: "칠판",
      students: ["심지안", "송민주", "김은솔"],
      desc: "칠판 정리 및 수업 전후 환경 정돈",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-sky-50 p-8 shadow-sm">
        <div className="text-sm font-medium text-rose-500">2학년 2반 학급 운영 조직</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          1인 1역할 최종표
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          우리 반의 역할은 업로드한 학급 조직도 PDF의 부서·역할 체계를 바탕으로 정리했고,
          일부 실제 운영 역할은 추가 운영 역할로 따로 묶었어. :contentReference[oaicite:1]{index=1}
        </p>
      </section>

      {sections.map((section) => (
        <section
          key={section.dept}
          className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">{section.emoji}</span>
            <h2 className="text-xl font-bold text-gray-900">{section.dept}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    역할
                  </th>
                  <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    담당자
                  </th>
                  <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody>
                {section.roles.map((item) => (
                  <tr key={`${section.dept}-${item.role}`} className="align-top">
                    <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                      {item.role}
                    </td>
                    <td className="border-b px-4 py-4 text-sm text-gray-800">
                      <div className="flex flex-wrap gap-2">
                        {item.students.map((student) => (
                          <span
                            key={student}
                            className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700"
                          >
                            {student}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b px-4 py-4 text-sm leading-6 text-gray-700">
                      {item.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900">추가 운영 역할</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {extraRoles.map((item) => (
            <div
              key={item.role}
              className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
            >
              <div className="text-base font-bold text-gray-900">{item.role}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.students.map((student) => (
                  <span
                    key={student}
                    className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                  >
                    {student}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-sm leading-6 text-gray-700">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}