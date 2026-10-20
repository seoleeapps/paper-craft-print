# 독립 UI 검수 3회차

마지막 재확인 후보 `1a66d90b94e27110667d5211fbf67fc2f4dea51d`의 개발 환경 기능과 UX는 통과다. 2회차 쇼핑백 바닥 절단선 결함은 수정된 기하와 실제 화면 및 PDF에서 해결을 확인했다. 실제 Android 광고와 OS 연결, 실물 조립은 미실행이다.

- 검수자: qa_round_1, 구현자 root와 독립
- 최종 재확인 계획 UTC: 2026-10-20T16:05:10.051644+00:00
- 최종 재확인 시작 UTC: 2026-10-20T16:06:40.450335+00:00
- 최종 재확인 종료 UTC: 2026-10-20T16:10:19.389350+00:00
- 환경: RN Web, 독립 Edge, 390×844 및 320×568, CSS 텍스트 150%
- 검사: TypeScript 26개, Python 빌드 경계 8개, A4 및 Letter PDF 12개 통과
- 실제 화면 여정: 12개 통과, pageerror 0개
- 큰 사진: 원본 10,497,196 bytes, 저장 6,565,536 bytes, 재실행 및 복제 및 하나 삭제 후 해시 동일
- 홈과 내 작업 배너 각 1개, 두 화면 전환 시 DOM 인스턴스 유지
- 본인 세션 정상 반납, 기기 조회와 조작 없음

| 기능 | 기능 | UX | 주요 근거 |
|---|---|---|---|
| templates | 통과 | 통과 | [recheck/check-dev.log](recheck/check-dev.log), [recheck/journey.json](recheck/journey.json), [recheck/paper-bag-cut-audit.json](recheck/paper-bag-cut-audit.json), [recheck/Paper-bag.png](recheck/Paper-bag.png) |
| editing | 통과 | 통과 | [recheck/journey.json](recheck/journey.json), [recheck/contact-editor.png](recheck/contact-editor.png), [recheck/editor-ko-small-large-text.png](recheck/editor-ko-small-large-text.png), [recheck/large-photo-editor.png](recheck/large-photo-editor.png) |
| preview | 통과 | 통과 | [recheck/contact-layout.png](recheck/contact-layout.png), [recheck/paper-bag-layout.png](recheck/paper-bag-layout.png), [recheck/paper-bag-cut-audit.json](recheck/paper-bag-cut-audit.json), [recheck/glue-contact-analysis.json](recheck/glue-contact-analysis.json) |
| pdf | 통과 | 통과 | [recheck/check-dev.log](recheck/check-dev.log), [recheck/journey.json](recheck/journey.json), [recheck/pdf-inspection.json](recheck/pdf-inspection.json), [recheck/Envelope.png](recheck/Envelope.png) |
| drafts | 통과 | 통과 | [recheck/journey.json](recheck/journey.json), [recheck/large-photo.json](recheck/large-photo.json), [recheck/large-photo-editor.png](recheck/large-photo-editor.png), [recheck/large-photo-restored.png](recheck/large-photo-restored.png) |
| ads | 통과 | 통과 | [recheck/check-dev.log](recheck/check-dev.log), [recheck/journey.json](recheck/journey.json), [recheck/large-photo.json](recheck/large-photo.json), [recheck/home-en-banner.png](recheck/home-en-banner.png) |
| locale | 통과 | 통과 | [recheck/journey.json](recheck/journey.json), [recheck/home-en.png](recheck/home-en.png), [recheck/home-ko-small-large-text.png](recheck/home-ko-small-large-text.png), [recheck/editor-ko-small-large-text.png](recheck/editor-ko-small-large-text.png) |

## 2회차 결함 해결

쇼핑백 바닥 경계 x=60, 85, 135 mm 각각에 경계의 양쪽 0.5 mm 위치를 잇는 폭 1 mm 절단 틈이 있다. 양변이 몸통 바닥 y=95 mm까지 이어지고 몸통 끝을 연결하는 절단선도 존재한다. 외곽의 18개 꼭짓점은 모두 두 선분과 연결돼 닫혀 있다. [기하 검사](recheck/paper-bag-cut-audit.json), [PDF 렌더](recheck/Paper-bag.png), [실제 배치 화면](recheck/paper-bag-layout.png)에서 확인했다.

풀칠 안내도 기하상 일치한다. 앞 벽과 뒷 벽의 바깥 법선을 각각 y=-1, y=+1로 두고 폭 방향 축으로 앞 날개는 +90도, 뒷 날개는 -90도 회전하면 두 인쇄면은 모두 바닥 바깥 z=-1을 향한다. 마지막 뒷 날개는 접히는 동안 z<0, 곧 먼저 접은 앞 날개 아래에서 접근한다. 따라서 앞 날개의 인쇄면 아래쪽과 뒷 날개의 빈 윗면이 맞닿는다. 작은 날개, 앞 날개, 표시한 인쇄면 풀칠, 뒷 날개의 순서와 원래 풀칠 위치는 일치한다. [법선과 접힘 계산](recheck/glue-contact-analysis.json)에 수치를 남겼다. 두께 0의 종이를 가정한 계산이며 실물 조립 통과가 아니다.

## templates

6종 기본값과 프리셋이 A4 및 Letter에 100% 치수로 배치된다. 쇼핑백 바닥 경계 3곳의 폭 1 mm 절단 틈 양변과 몸통 끝 연결선이 모두 있고 외곽 18개 꼭짓점의 연결 차수가 2다. 홈의 이름, 치수와 전개도 썸네일로 도안을 구분한다. 쇼핑백은 바닥 날개를 분리하는 실제 절단 틈이 생겼고 조립 순서가 구체화됐다.

## editing

6종에서 앞면 사진과 확대, 앞뒷면 문구 입력을 실제 실행했다. 999 mm 입력은 출력이 차단되고 60 mm로 복구하면 다시 허용된다. 추가 10,497,196 byte 사진도 정상 편집됐다. 치수 범위와 조립 안내, 문구 글자 수, 사진 제거 및 확대와 이동 조작이 보인다. 320×568 및 텍스트 150%에서 문구 입력과 고정 출력 버튼을 사용할 수 있다.

## preview

6종 실제 미리보기에서 Letter 선택과 반복 토글을 실행했다. 카드와 책갈피 2개 반복 및 회전된 상자, 사진과 문구 방향이 PDF와 일치한다. 쇼핑백 바닥 절단 틈이 실제 화면에도 표시된다. 종이, 반복 수량, 선의 의미와 100% 출력 안내를 읽을 수 있다. 쇼핑백은 작은 날개, 앞 날개, 풀칠, 뒷 날개의 순서가 표시되며 인쇄면과 빈 면의 접촉은 기하 계산과 일치한다.

## pdf

브라우저에서 내려받은 6개 PDF를 Poppler로 렌더링하고 1페이지 Letter 크기를 확인했다. A4 및 Letter 개발 PDF 12개는 한글, 영어, 100% 안내와 50 mm 벡터 검사를 통과했다. 수정된 쇼핑백 절단선도 PDF에 존재한다. 직접 본 렌더에서 사진과 문구, 자르기 선과 접는 선, 접착 해칭, 확인선과 조립 안내가 겹치거나 종이 밖으로 나가지 않는다. 완료 화면은 저장과 공유 및 인쇄 선택을 제공한다.

## drafts

정확한 새 fixture에서 이전 봉투와 waves 권한이 복구됐고 stars 보상, 복제, 삭제 및 재시작 복구가 동작했다. IndexedDB에 정규화 사진 6,565,536 bytes를 보관하고 새로고침, 복제와 한 개 삭제 후 해시가 동일함을 확인했다. 큰 사진이 재실행 후 실제 미리보기에 돌아온다. 초안 제목, 문구와 치수, 복제 및 삭제 버튼, 새 작업 버튼과 배너가 구분된다.

## ads

실제 ads.ts를 대체 SDK 콜백과 실행한 검사에서 초기 동의 조회 캐시와 SDK 단일 초기화, privacy 재확인 및 철회가 통과했다. Web no-fill 후 무료 PDF와 동의 거절 후 무료 한국어 PDF가 동작했다. 홈과 내 작업에 각 배너 1개가 보이고 DOM 인스턴스가 동일하게 유지된다. 홈과 내 작업 광고는 Advertisement 표기와 여백으로 버튼과 분리된다. 편집, 출력과 완료에는 배너가 없고 광고 실패가 무료 제작을 막지 않는다. 실제 네이티브 광고 송출은 미검수다.

## locale

영어와 한국어 전환, 한글 PDF, 320×568 및 CSS 텍스트 150%에서 입력과 PDF 생성이 동작했다. 작은 화면의 큰 글씨는 문구와 카드 치수를 줄바꿈하며 입력과 출력이 가능하다. 화면 및 PDF 한글이 깨지지 않는다.

## 실패 원본과 마지막 재확인

초기 후보 d2e861c의 전체 여정은 이전 QA 초안이 선택돼 Stars Ad unlock 선택자를 찾지 못했다. 이후 좁은 진단에서는 고유 fixture 이관과 no-fill 무료 출력이 통과했지만 복제 직후 비동기 목록 갱신을 기다리지 않아 수량 검사에서 멈췄다. 두 실패의 traceback, 실제 body, 화면과 저장 상태를 이 폴더에 보존했다.

root가 제품 코드 변경 없이 heading 및 수량 대기를 helper에 추가했다. [단회 재확인 계획](fixture-recheck-plan.json)에 따라 새 SHA에서 전체 개발 검사와 실제 화면 여정을 마지막 한 번 실행했다. 이 보고서의 통과는 새 SHA의 실제 재확인 결과에만 해당한다. 1회차와 2회차 원본은 수정하지 않았다.

## 확인하지 않은 항목

- 실제 Android 광고 SDK, UMP 폼, 배너와 보상 광고 송출은 미실행이다. 실제 adapter 코드를 대체 SDK 콜백과 실행한 검사만 통과했다.
- IndexedDB와 브라우저 사진 선택 및 다운로드를 검수했다. Android SQLite, 사진 권한과 OS 저장 및 공유 및 인쇄는 미실행이다.
- 텍스트 150%는 RN Web CSS 확대이며 Android 시스템 글꼴과 화면 키보드 검수는 아니다.
- 쇼핑백 풀칠 판정은 두께 0의 종이와 인쇄면이 몸통 바깥이라는 전제로 계산했다. 실물 인쇄 및 조립은 미확인이다.
- 이 회차에 최초 실행 및 좁은 진단 실패가 있었다. 제품 코드를 바꾸지 않고 helper 대기만 고친 새 SHA에서 계획한 단 한 번의 전체 재확인을 실행했다. 실패를 통과로 소급 변경하지 않았다.
