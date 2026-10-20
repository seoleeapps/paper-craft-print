# 독립 UI 검수 1회차

개발 환경 기능 및 UX 검수 결과는 통과다. 구현자와 다른 검수자 `qa_round_1`이 후보 `39bea11cfac77834d7b253614094e775c4336a3f`에서 실행했다. 수정이 필요한 결함은 발견하지 못했다.

- 계획 시각: 2026-10-20T15:38:06.650772+00:00
- 시작 UTC: 2026-10-20T15:39:10.260369+00:00
- 종료 UTC: 2026-10-20T15:42:47.795493+00:00
- 실제 실행: http://localhost:8087, 독립 Edge, 390×844 및 320×568, 작은 화면에서는 텍스트 150%
- 검수 데이터: 해당 독립 세션에 이전 봉투 1개와 보상 권한을 시드했다. 다른 세션과 기기에 접근하지 않았다.
- `npm run check:dev`: exit 0, 25개 검사 통과, A4 및 Letter PDF 12개 검사 통과
- 실제 RN Web 여정: 12개 시나리오 통과, pageerror 0개
- 독립 브라우저 세션은 정상 반납했다.

| 기능 | 기능 판정 | UX 판정 | 실제 근거 |
|---|---|---|---|
| templates | 통과 | 통과 | [check-dev.log](check-dev.log), [journey.json](journey.json), [Envelope.pdf](Envelope.pdf), [Gift-box.pdf](Gift-box.pdf), [Folded-card.pdf](Folded-card.pdf) |
| editing | 통과 | 통과 | [journey.json](journey.json), [check-dev.log](check-dev.log), [envelope-editor.png](envelope-editor.png), [gift-box-editor.png](gift-box-editor.png), [folded-card-editor.png](folded-card-editor.png) |
| preview | 통과 | 통과 | [journey.json](journey.json), [envelope-layout.png](envelope-layout.png), [gift-box-layout.png](gift-box-layout.png), [folded-card-layout.png](folded-card-layout.png), [gift-tag-layout.png](gift-tag-layout.png) |
| pdf | 통과 | 통과 | [journey.json](journey.json), [pdf-inspection.json](pdf-inspection.json), [check-dev.log](check-dev.log), [Envelope.png](Envelope.png), [Gift-box.png](Gift-box.png) |
| drafts | 통과 | 통과 | [journey.json](journey.json), [check-dev.log](check-dev.log), [supplement.json](supplement.json), [drafts-en.png](drafts-en.png), [drafts-en-legacy.png](drafts-en-legacy.png) |
| ads | 통과 | 통과 | [journey.json](journey.json), [supplement.json](supplement.json), [check-dev.log](check-dev.log), [home-en.png](home-en.png), [drafts-en.png](drafts-en.png) |
| locale | 통과 | 통과 | [journey.json](journey.json), [supplement.json](supplement.json), [pdf-inspection.json](pdf-inspection.json), [home-en.png](home-en.png), [home-ko-small-large-text.png](home-ko-small-large-text.png) |

## templates

6종 생성, 기본값과 프리셋의 A4 및 Letter 원치수 배치, 닫힌 자르기 선과 종이 초과 차단을 확인했다. 홈에 6종 이름, 치수, 실제 전개도 썸네일이 보이며 조립 방법이 편집과 출력에 제공된다.

## editing

6종 앞면 문구, 사진 선택과 확대, 뒷면 한글 문구를 입력하고 PDF까지 진행했다. 999 mm 입력 차단 후 60 mm 복구를 확인했다. 치수 범위, 사진 제거, 확대와 이동, 문구 글자 수가 보이며 고정된 출력 버튼은 콘텐츠와 분리된다.

## preview

6종 출력 배치 화면에서 Letter 선택과 반복 토글이 동작했다. 카드와 책갈피의 2개 반복, 회전된 상자, 사진과 한글 문구의 방향이 PDF와 일치한다. 종이 종류, 반복 여부와 수량, 자르기 및 접기 선 안내, 조립 안내, 100% 출력과 50 mm 측정 안내가 출력 버튼 앞에 보인다.

## pdf

브라우저에서 저장한 6개 PDF를 Poppler로 열고 1페이지 Letter 크기를 확인했다. 12개 A4/Letter 개발 PDF에서 한글, 영어, 100% 안내와 실제 50 mm 벡터 선을 검사했다. 렌더링에서 선, 접착 해칭, 사진, 문구와 짧은 조립 안내가 겹치거나 종이 밖으로 나가지 않는다. 완료 화면에 저장, 공유와 인쇄 선택이 제공된다.

## drafts

kind 없는 이전 봉투와 waves 권한 복구, stars 보상 후 복제, 삭제, 새로고침 복구를 확인했다. 저장 트랜잭션과 실패 롤백 검사도 통과했다. 제목, 치수와 문구로 작업을 구분할 수 있고 복제 및 삭제 버튼, 새 작업 버튼과 광고가 분리된다.

## ads

홈과 내 작업 배너 각 1개, 편집 및 출력 및 완료 배너 0개를 확인했다. no-fill 무료 출력, 동의 철회 및 재시작 후 배너 0개, 재동의 후 홈 및 내 작업 배너 1개를 확인했다. 보상 중복과 SDK 초기화 중복 방지의 개발 검사도 통과했다. 광고 표기와 여백이 있고 내 작업의 새 작업 버튼과 분리된다. 설정에서 광고 개인정보 선택과 로컬 보관 설명을 읽을 수 있다.

## locale

한국어와 영어 전환, 320×568 및 텍스트 150%에서 입력과 PDF 생성, 390×844에서 수평 문서 넘침 없음이 확인됐다. 작은 화면의 큰 글씨에서도 카드가 줄바꿈되고 문구 입력과 출력 버튼이 접근 가능하다. 화면과 PDF 한글이 깨지지 않는다.

## 결함과 확인 범위

수정이 필요한 기능 또는 UX 결함은 발견하지 못했다. 실행을 반복해서 실패를 숨기지 않았으며 전체 여정은 1회 실행했다. 같은 회차 안에서 초안 목록과 광고 동의 변경의 화면 근거를 추가 수집했다.

- 실제 Android 배너, UMP 동의 폼과 SDK 초기화 및 테스트 광고 송출은 미실행이다. RN Web 광고는 개발 대역이다.
- 브라우저 파일 선택, localStorage, 다운로드와 공유 및 인쇄 대역을 검수했다. Android 사진 접근 권한, SQLite 재시작 보관, OS 저장 및 공유 및 인쇄는 미실행이다.
- 큰 글씨는 RN Web 텍스트를 CSS 150%로 확대한 개발 검수이며 Android 시스템 글꼴 확대 검수는 아니다.
- 실물 인쇄와 조립은 승인 범위에 따라 미확인으로 남긴다.
- 브라우저 여정은 도안 간 반복 설정을 유지하므로 토글 후 각 화면에 표시된 상태를 확인했다. 모든 도안의 반복 배치 경계는 개발 자동 검사로 확인했다.

기기 사용은 하지 않았다. 위 미실행 항목을 네이티브 통과로 계산하지 않는다. 모든 PNG와 PDF는 검수자가 직접 열어 확인했으며 원본 다운로드와 렌더를 이 폴더에 보존한다.
