# README.md

# Next Auth API

이 프로젝트는 Next.js를 기반으로 한 인증 API입니다. 사용자의 로그인 요청을 처리하고, 인증 토큰을 반환하는 기능을 제공합니다. 또한 사용자 정보를 가져오거나 업데이트하는 API 엔드포인트를 포함합니다.

## 설치

1. 이 저장소를 클론합니다.
   ```bash
   git clone <repository-url>
   ```

2. 프로젝트 디렉토리로 이동합니다.
   ```bash
   cd next-auth-api
   ```

3. 의존성을 설치합니다.
   ```bash
   npm install
   ```

4. 환경 변수를 설정합니다. `.env` 파일을 수정하여 데이터베이스 연결 문자열 및 API 키를 입력합니다.

## 사용 방법

1. 개발 서버를 시작합니다.
   ```bash
   npm run dev
   ```

2. API 엔드포인트에 요청을 보냅니다.
   - 로그인: `POST /api/auth`
   - 사용자 정보 가져오기: `GET /api/users`
   - 사용자 정보 업데이트: `PUT /api/users`

## 파일 구조

```
next-auth-api
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── route.ts
│   │   │   └── users
│   │   │       └── route.ts
│   ├── lib
│   │   ├── auth.ts
│   │   └── db.ts
│   ├── models
│   │   └── User.ts
│   └── types
│       └── index.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## 기여

기여를 원하시면 이 저장소를 포크하고 풀 리퀘스트를 제출해 주세요.