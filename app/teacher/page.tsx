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
            <div className="text-sm text-gray-600">2학년 2반 담임 자기소개</div>
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