# Commerce Payment UI

**Commerce Payment Orchestrator**의 개발자 문서 포털입니다.  
가맹점이 PayCore API를 연동하는 방법을 단계별로 안내하고, 샌드박스에서 API를 직접 테스트할 수 있습니다.

---

## 👨‍💻 Developer

| jeonggu.kim<br />(김정현) |
|:---:|
| <a href="https://github.com/dev-jeonggu"> <img src="https://avatars.githubusercontent.com/dev-jeonggu" width=100px alt="_"/> </a> |
| <a href="https://github.com/dev-jeonggu">@dev-jeonggu</a> |

---

## 🛠️ Stack

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=React&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat&logo=TypeScript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat&logo=Vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=flat&logo=TailwindCSS&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=Nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=Docker&logoColor=white)

---

## 📄 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 개요 — PayCore 소개, 인증 방식, 결제 흐름 |
| `/quickstart` | 퀵스타트 — 최소 코드로 5분 안에 연동 |
| `/tutorial` | 튜토리얼 — 가맹점 등록부터 Webhook 처리까지 단계별 가이드 |
| `/guide/payment` | 결제 요청 가이드 |
| `/guide/cancel` | 결제 취소·환불 가이드 |
| `/guide/webhook` | Webhook 연동 가이드 |
| `/guide/virtual-account` | 가상계좌 가이드 |
| `/guide/billing` | 정기결제 (빌링키) 가이드 |
| `/reference` | REST API 전체 레퍼런스 |
| `/sandbox` | 샌드박스 — API 직접 호출 테스트 콘솔 |

---

## 🗂️ 프로젝트 구조

```
src/
├── api/
│   ├── client.ts          # Axios 인스턴스 (X-Merchant-Id, X-Api-Key 자동 주입)
│   ├── orders.ts          # merchantOrderId 로컬 생성 유틸
│   └── payments.ts        # 결제 등록 / 취소 / 조회 API 호출
├── components/
│   ├── DocsLayout.tsx     # 문서 레이아웃 (사이드바 + 이전/다음 네비게이션)
│   ├── CodeBlock.tsx      # 코드 블록 (복사 버튼 포함)
│   ├── Navbar.tsx
│   └── Footer.tsx
├── hooks/
│   └── usePortOne.ts      # PortOne SDK 래퍼
├── pages/
│   ├── DocsHome.tsx       # 개요 페이지
│   ├── Tutorial.tsx       # 단계별 연동 튜토리얼
│   ├── Guides.tsx         # 연동 가이드 모음 + 퀵스타트 + API 레퍼런스
│   └── Playground.tsx     # 샌드박스 (인터랙티브 API 콘솔)
└── types/index.ts         # 공통 타입 정의
```

---

## ⚙️ 실행 방법

### 백엔드와 함께 Docker로 실행 (권장)

[Commerce Payment Orchestrator](https://github.com/dev-jeonggu/commerce-payment-orchestrator)의 `docker-compose.yml`에 포함되어 있습니다.

```bash
# 오케스트레이터 레포 루트에서 실행
docker compose up -d --build
```

프론트엔드는 `http://localhost:8888`에서 실행됩니다.

### 로컬 개발 서버

```bash
# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env

# 개발 서버 실행 (Vite proxy → localhost:8080으로 API 요청 전달)
npm run dev
```

`http://localhost:3000`에서 실행됩니다.

---

## 🌐 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | 빈값 | 백엔드 API 베이스 URL (개발: Vite proxy 사용으로 비워도 됨) |
| `VITE_MERCHANT_ID` | `test-merchant` | 샌드박스 가맹점 ID |
| `VITE_MERCHANT_API_KEY` | `test-secret-key-paycore` | 샌드박스 API Key |

> 백엔드 `DataInitializer`가 앱 시작 시 `test-merchant` 가맹점을 자동으로 생성합니다.
> 별도 가맹점 등록 없이 기본값으로 바로 테스트할 수 있습니다.

---

## 🔗 연관 프로젝트

- **Backend**: [commerce-payment-orchestrator](https://github.com/dev-jeonggu/commerce-payment-orchestrator) — 결제 처리 API 서버
