# 단축키 학습 관리 시스템

단축키 학습을 도와주는 웹 애플리케이션입니다. 다양한 프로그램의 단축키를 학습하고 관리할 수 있습니다.

## 주요 기능

- 🔍 실시간 검색 및 필터링
- 📊 학습 진행도 추적
- ⭐ 즐겨찾기 기능
- 📱 반응형 디자인
- 🌙 다크 모드 지원
- ♿ 접근성 지원

## 기술 스택

- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage API
- Font Awesome Icons

## 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/Julia5971/hw_shortcuts_2.git
cd hw_shortcuts_2
```

2. 웹 서버 실행
```bash
# Python을 사용하는 경우
python -m http.server 8000

# Node.js를 사용하는 경우
npx serve
```

3. 브라우저에서 접속
```
http://localhost:8000
```

## 사용 방법

### 검색
- 검색창에 키워드를 입력하여 단축키 검색
- 카테고리나 난이도로 필터링 가능
- 최근 검색어 기록 확인 가능

### 학습 관리
- 단축키 카드의 '학습하기' 버튼으로 학습 상태 토글
- '즐겨찾기' 버튼으로 즐겨찾기 추가/제거
- 학습 진행도 자동 추적

### 통계 확인
- 전체 단축키 수
- 학습 완료한 단축키 수
- 즐겨찾기한 단축키 수
- 카테고리별/난이도별 진행도

## 성능 최적화

- 가상 스크롤링 구현
- 데이터 캐싱 시스템
- 이벤트 리스너 최적화
- DOM 조작 최소화

## 접근성

- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 고대비 모드 지원
- 다크 모드 지원

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 개발 가이드

### 프로젝트 구조
```
hw_shortcuts_2/
├── index.html          # 메인 HTML 파일
├── css/
│   └── style.css      # 스타일시트
├── js/
│   ├── main.js        # 메인 JavaScript 파일
│   └── data.js        # 데이터 관리 모듈
└── data/
    └── shortcuts.json # 단축키 데이터
```

### 코드 스타일
- ESLint 규칙 준수
- Prettier 포맷팅 사용
- 의미있는 변수명 사용
- 주석 작성 필수

### 테스트
- 브라우저 콘솔에서 디버깅 모드 활성화
- 검색 기능 테스트
- 학습 관리 시스템 테스트
- 반응형 디자인 테스트

## 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처

프로젝트 관리자 - [@Julia5971](https://github.com/Julia5971)

프로젝트 링크: [https://github.com/Julia5971/hw_shortcuts_2](https://github.com/Julia5971/hw_shortcuts_2)

© 2025 Julia5971. All rights reserved. 