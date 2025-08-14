# Jakdang Front

## 기술 스택
- Java - 17
- node.js - 20.19.0
- MariaDB - 10.11.5

## 프로젝트 규칙 및 구조

### 상태 관리
- Jotai를 사용하여 전역 상태 관리
- 인증 관련 상태는 `authAtoms.js`에서 관리
- 예시: `useSetAtom`, `accessTokenAtom`, `userInfoAtom`

### API 통신
- `useAxios` 커스텀 훅 사용
- 환경변수는 `import.meta.env`를 통해 접근
- API URL은 환경변수로 관리 (`VITE_API_URL`)

### 인증
- 소셜 로그인 구현 (Google, Kakao, Naver, Apple)
- 토큰 기반 인증 사용 (accessToken)
- 사용자 정보는 별도로 관리

### 스타일링
- Tailwind CSS 사용
- UI 컴포넌트는 shadcn/ui 사용
- 컴포넌트별 스타일은 Tailwind 클래스로 관리

### 라우팅
- React Router 사용
- 페이지 이동은 `useNavigate` 훅 사용

### 파일 구조
```
src/
├── components/     # 재사용 가능한 컴포넌트
│   └── sign/      # 인증 관련 컴포넌트
├── hooks/         # 커스텀 훅
│   └── useAxios.js
├── lib/          # 유틸리티 및 설정
│   └── google/   # 구글 인증 관련
├── recoil/       # 상태 관리
│   └── authAtoms.js
├── routes/       # 라우팅 설정
└── pages/        # 페이지 컴포넌트
```

## 개발 가이드라인

1. **상태 관리**
   - 전역 상태는 반드시 Jotai 사용
   - 상태 atom은 관련 도메인 폴더에 위치

2. **컴포넌트 개발**
   - 재사용 가능한 컴포넌트는 components 폴더에 위치
   - 페이지 컴포넌트는 pages 폴더에 위치
   - UI 컴포넌트는 가능한 shadcn/ui 활용

3. **스타일링**
   - Tailwind CSS 클래스 사용
   - 커스텀 스타일은 필요한 경우에만 사용

4. **API 통신**
   - API 호출은 useAxios 훅 사용
   - 환경변수는 .env 파일에서 관리

5. **라우팅**
   - 페이지 이동은 useNavigate 훅 사용
   - 라우트 정의는 routes 폴더에서 관리

## 환경 설정
1. 필요한 환경변수 설정 (.env 파일)
2. 패키지 설치: `npm install`
3. 개발 서버 실행: `npm run dev`