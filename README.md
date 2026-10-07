This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 시험 일정 안내

`components/lib/semester.ts`의 `SCHOOL_EXAMS`에서 확인된 시작일과 종료일을 관리합니다.
종료일이 미확인인 시험은 `end`를 생략하며, 시작일 다음 날부터 안내를 숨깁니다.
종료일을 입력하면 해당 날짜까지 시험 기간으로 표시합니다. 지난 시험은 홈 D-day와 배너에서 제외되며, 다음으로 확인된 학교 시험이 표시됩니다.

날짜 경계 테스트는 Node.js 22.6 이상에서 `npm test`로 실행합니다.
한국 시간 자정, 시험 전날·시작일·종료일·종료 다음 날, 종료일 미확인, 기말고사 선택을 검증합니다.
