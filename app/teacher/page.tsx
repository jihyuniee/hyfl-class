"use client";

import Image from "next/image";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-gray-800">{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
      {children}
    </span>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export default function TeacherPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">한영외국어고등학교 2학년 2반 담임 자기소개</div>
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, 지현쌤(정보쌤/인탐쌤/컴쌤)입니다.
            </h1>

            <div className="flex flex-wrap gap-2 pt-1">
              <Chip>담임/과목: 정보 컴퓨터</Chip>
              <Chip>인공지능 원리 탐구</Chip>
              <Chip>이름: 이지현 (별칭: 컴도리)</Chip>
            </div>

            <div className="pt-2 text-sm text-gray-700">
              <div className="font-semibold">여러분이 불러도 되는 호칭</div>
              <div>지현쌤 · 정보쌤 · 인탐쌤 · 컴쌤</div>
            </div>
          </div>

          {/* 캐릭터 이미지 */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border bg-gray-50 p-3">
              <Image
                src="/comdori.png"
                alt="컴도리"
                width={96}
                height={96}
                className="rounded-xl"
                priority
              />
              <div className="mt-2 text-center text-xs text-gray-600">컴도리</div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-3">
              <Image
                src="/comsuni.png"
                alt="컴수니"
                width={96}
                height={96}
                className="rounded-xl"
              />
              <div className="mt-2 text-center text-xs text-gray-600">컴수니</div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">오늘부터 우리 반 슬로건</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            “지금부터 할 수 있는 것부터, 나부터.”
          </div>
        </div>
      </div>

      {/* 5가지 카드 */}
      <Card title="저를 빠르게 소개하면 (5가지 카드)">
        <List
          items={[
            "제가 좋아하는 음식: 불닭 (매운 맛은 대체로 환영합니다.)",
            "제가 좋아하는 음악/특기: 피아노 (듣는 것도, 치는 것도 좋아합니다.)",
            "제가 요즘 좋아하는 취미: 바이브코딩 (아이디어를 말로 정리해서 구현해 보는 걸 좋아합니다.)",
            "제가 좋아하는 반 분위기: 성실함 · 예의바름 · 웃음이 있는 교실",
            "제가 어려워하는 것(=싫어하는 것): “대충”하는 태도 (노력한 흔적이 없는 건 싫어합니다.)",
          ]}
        />
      </Card>

      {/* 중요하게 생각하는 것 */}
      <Card title="제가 중요하게 생각하는 것 (우리 반 기준)">
        <p>
          저는 “차분하고 따뜻하지만, 기준은 분명한 담임”을 목표로 합니다. 우리 반에서 특히 지키고
          싶은 약속은 아래입니다.
        </p>
        <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
          <div className="font-semibold text-gray-900">우리 반 핵심 약속 5가지</div>
          <List
            items={[
              "거짓말 금지: 실수는 괜찮지만, 숨기지는 말기. 같이 해결하기.",
              "배려하기: 말투/표정/뒷말로 사람을 힘들게 하지 않기.",
              "청소는 ‘우리 일’: 교실은 함께 쓰는 공간입니다.",
              "태도: 수업/조회/종례에서 기본 태도는 서로에 대한 존중입니다.",
              "예의: 선생님에게만이 아니라 친구·타 반·급식실·행정실 모두에게 예의 지키기.",
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="제가 칭찬을 많이 하는 순간">
          <List
            items={[
              "인사를 자연스럽게 잘하는 학생(기본이 정말 어렵고, 정말 멋집니다.)",
              "청소를 ‘누가 보든 안 보든’ 책임감 있게 하는 학생",
              "할 수 있는 만큼이라도 성실하게 해보려는 태도를 보이는 학생",
            ]}
          />
        </Card>

        <Card title="제가 단호해지는 순간(선 넘는 것)">
          <List
            items={[
              "예의 없는 말/행동(무시, 비꼼, 조롱 포함)",
              "거짓말",
              "이기주의로 공동체를 망가뜨리는 행동(책임 회피, 남에게 떠넘기기 등)",
            ]}
          />
        </Card>
      </div>

      {/* 상담/연락 */}
      <Card title="상담/연락 안내 (편하게, 하지만 규칙은 지켜요)">
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-gray-900">상담 방식</div>
            <div>대면 / 메신저 / 예약제 모두 가능합니다.</div>
          </div>

          <div>
            <div className="font-semibold text-gray-900">상담 가능한 시간</div>
            <div>
              조회 전, 점심시간, 방과 후, 특히 <span className="font-semibold">월요일</span>에 여유가
              있습니다. (긴 상담이 필요하면 예약이 가장 좋습니다.)
            </div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold text-gray-900">연락 규칙</div>
            <List
              items={[
                "오후 6시 이후에는 답이 늦을 수 있습니다.",
                "급한 일은 [구글/카톡 중 우리 반에서 정한 채널]로 보내 주세요.",
                "사소한 것도 괜찮지만, 예의 있는 문장으로 부탁합니다. (저도 그렇게 답하겠습니다.)",
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 퀴즈 */}
      <Card title="컴도리’s QUIZ (첫 만남용)">
        <p className="text-gray-700">
          아래는 “지현쌤 사용설명서” 퀴즈입니다. 오늘/이번 주에 정답 공개할게요.
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold">1) 제가 더 자주 하는 말은?</div>
            <div className="mt-1">A. “괜찮아, 다음에 하면 돼.”</div>
            <div>B. “지금부터 할 수 있는 것부터, 나부터.”</div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold">2) 제가 더 좋아하는 교실은?</div>
            <div className="mt-1">A. 조용히 집중되는 교실</div>
            <div>B. 웃음이 있고, 선을 지키는 교실</div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold">3) 제가 더 신뢰하는 것은?</div>
            <div className="mt-1">A. ‘잘한다’는 말</div>
            <div>B. ‘꾸준히 했다’는 기록/과정</div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold">4) “바이브코딩”에 가까운 설명은?</div>
            <div className="mt-1">A. 감으로 막 코딩하기</div>
            <div>B. 아이디어를 말/글로 정리해서 구현해 보기</div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-semibold">5) 제가 좋아하는 음식은?</div>
            <div className="mt-1">A. 불닭</div>
            <div>B. (평범한 맛)</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-4 text-sm text-gray-700">
          정답을 맞힌 사람에게는{" "}
          <span className="font-semibold">[소소한 칭찬/혜택]</span>을 고민해 보겠습니다.
        </div>
      </Card>

      {/* 첫날/첫주 */}
      <Card title="첫날/첫주에 여러분에게 받고 싶은 것 (짧게만!)">
        <p className="text-gray-700">
          아래 질문에 <span className="font-semibold">짧게</span>라도 답해 주면, 담임이 1년을
          운영하는 데 큰 도움이 됩니다.
        </p>
        <List
          items={[
            "선생님이 나를 부를 때 원하는 이름/호칭은?",
            "올해 내가 가장 걱정되는 것 1가지는? (공부/관계/진로/생활 아무거나)",
            "담임에게 바라는 점 1가지는?",
            "요즘 내가 좋아하는 것 1가지는? (음악/게임/운동/음식 등)",
            "“나는 이런 방식이면 더 편해요” (말 먼저 걸어주기/조용히 두기/메신저로 이야기하기 등)",
          ]}
        />
        <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
          <div className="font-semibold text-gray-900">마지막으로</div>
          <p className="mt-1">
            저는 여러분이 <span className="font-semibold">믿을 수 있는 어른</span>으로 남고
            싶습니다. 완벽한 한 해가 아니어도 괜찮습니다. 대신,{" "}
            <span className="font-semibold">지금부터 할 수 있는 것부터</span>,{" "}
            <span className="font-semibold">나부터</span> 같이 해봅시다.
          </p>
        </div>
      </Card>


      {/* 학급 자율활동 안내 */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 24px', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius:22, border:'1.5px solid #86efac' }}>
          <span style={{ fontSize:28 }}>📢</span>
          <div>
            <p style={{ fontSize:12, fontWeight:800, color:'#22c55e', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.06em' }}>2026학년도</p>
            <h2 style={{ fontSize:17, fontWeight:900, color:'var(--text)', margin:0, letterSpacing:'-0.3px' }}>우리반 학급 자율활동 안내</h2>
            <p style={{ fontSize:13, color:'var(--text-muted)', margin:'4px 0 0', fontWeight:500 }}>올해 우리 반은 다음 3가지 학급 자율활동을 진행합니다.</p>
          </div>
        </div>

        {[
          {
            emoji: '🔬',
            title: '전공분야별 심화탐구활동',
            color: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
            shadow: 'rgba(14,165,233,0.2)',
            href: '/research',
            items: [
              '공통된 탐구 주제를 선정합니다.',
              '학년 초 관심 분야 또는 희망 진로를 바탕으로 모둠을 구성합니다.',
              '모둠별로 관련 도서를 선정하여 아침 자습 시간을 활용해 독서를 진행합니다.',
              '아침시간 및 HR 시간을 활용하여 심화 탐구 활동을 진행합니다.',
              '설문조사, 잡지 제작 등 다양한 형태의 결과물을 제작하고 1학기 말에 중간 보고물을 제출합니다.',
              '학년 말 HR 시간을 활용하여 모둠별 탐구 결과를 발표합니다.',
            ],
            note: '운영: HR 시간 활동은 회장, 부회장이 중심이 되어 진행합니다.',
          },
          {
            emoji: '🤝',
            title: '교과 멘토·멘티 협력 학습 활동',
            color: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            shadow: 'rgba(245,158,11,0.2)',
            href: '/mentor',
            items: [
              '교과별로 학습 역량이 우수한 학생을 멘토로 선발합니다.',
              '멘토는 친구들의 질문에 답변하며 학습을 돕습니다.',
              '시험 기간 전 예상 문제 제작 및 학습 자료 공유 활동을 합니다.',
              '간단한 쪽지시험 또는 문제 풀이 활동을 통해 학습 내용을 점검합니다.',
              '멘토 학생은 활동 내용을 멘토 활동 기록지에 작성합니다.',
            ],
            note: '운영: HR 시간 활동은 회장, 부회장이 중심이 되어 진행합니다.',
          },
          {
            emoji: '💪',
            title: '90일 좋은 습관 만들기 프로젝트',
            color: 'linear-gradient(135deg,#34d399,#3b82f6)',
            shadow: 'rgba(52,211,153,0.2)',
            href: '/habits',
            items: [
              '각자 만들고 싶은 좋은 습관을 하나 정합니다.',
              '90일 동안 꾸준히 실천하며 습관 형성을 목표로 합니다.',
              '매일 실천 여부를 웹앱에 체크합니다.',
              '서로의 실천을 응원하며 꾸준한 자기관리 습관을 기릅니다.',
            ],
            note: '운영: 웹앱을 통해 수시로 체크합니다.',
          },
        ].map((act) => (
          <div key={act.title} style={{ borderRadius:20, overflow:'hidden', boxShadow:`0 4px 20px ${act.shadow}` }}>
            <div style={{ background:act.color, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>{act.emoji}</span>
                <h3 style={{ color:'#fff', fontSize:15, fontWeight:900, margin:0, letterSpacing:'-0.3px' }}>{act.title}</h3>
              </div>
              <a href={act.href} style={{ fontSize:12, fontWeight:700, color:'#fff', background:'rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:999, textDecoration:'none', border:'1px solid rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>
                바로가기 →
              </a>
            </div>
            <div style={{ background:'#fff', padding:'16px 22px' }}>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
                {act.items.map((item, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary)', flexShrink:0, marginTop:6 }}/>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop:12, padding:'8px 14px', borderRadius:10, background:'#f9fafb', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:12, fontWeight:700, color:'var(--text-subtle)', margin:0 }}>📌 {act.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 하단 안내 */}
      <div className="rounded-2xl border bg-emerald-50 p-4 text-sm text-gray-800">
        <div className="font-semibold">사진(컴도리/컴수니) 넣는 방법</div>
        <ul className="mt-2 list-disc pl-5">
          <li>
            프로젝트의 <span className="font-semibold">public</span> 폴더에 이미지 파일을 넣고
            이름을 <span className="font-semibold">comdori.png</span>,{" "}
            <span className="font-semibold">comsuni.png</span> 로 맞춰줘.
          </li>
          <li>그럼 이 페이지에서 자동으로 보여.</li>
        </ul>
      </div>
    </div>
  );
}