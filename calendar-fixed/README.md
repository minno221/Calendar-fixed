# 학사일정

## 폴더 구조

```
calendar-app/
├── package.json
├── README.md
├── lib/
│   └── auth.js
├── pages/
│   ├── _app.js
│   ├── index.js
│   ├── admin.js
│   └── api/
│       ├── events.js
│       ├── verify.js
│       └── sync-neis.js
└── styles/
    └── globals.css
```

## 사용 방법

1. 이 폴더 전체를 GitHub 저장소에 올립니다.
2. Vercel(vercel.com)에서 New Project → 저장소 선택 → Deploy.
3. 프로젝트의 Storage 탭 → Create Database → **KV** 선택 → 생성. (환경변수 자동 설정)
4. **Settings → Environment Variables** 에서 아래 환경변수를 추가하고 **Redeploy** 합니다.
5. 배포된 주소로 들어가면 누구나 학사일정을 볼 수 있습니다.
6. 주소 + `/admin` 에서 비밀번호를 입력하면 일정을 추가/삭제하고 나이스에서 가져올 수 있습니다.

## 환경변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 필수 | 관리자 비밀번호. 코드에는 적지 않습니다. |
| `NEIS_KEY` | 나이스 가져오기 사용 시 | 나이스 교육정보 개방 포털 인증키 |
| `NEIS_OFFICE_CODE` | 선택 | 시도교육청 코드 (기본 `H10` 울산) |
| `NEIS_SCHOOL_NAME` | 선택 | 학교 이름 (기본 `호계고등학교`) |
| `NEIS_SCHOOL_CODE` | 선택 | 학교 코드를 알면 직접 입력 (이름 검색 생략) |

## 일정 분류

- 행사 (`event`) — 파란색
- 시험 (`exam`) — 빨간색
- 방학 (`break`) — 초록색

## 비밀번호 바꾸기

Vercel 환경변수 `ADMIN_PASSWORD` 값을 바꾸고 Redeploy 하면 끝입니다. 코드는 수정할 필요 없습니다.
