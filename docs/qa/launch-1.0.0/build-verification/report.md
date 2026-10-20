# 빌드 도구 변경 후 독립 L3 실행

후보 `d1464abc34dfc2f4c0af58a8abc0add97946dc31`에서 개발 환경 전체 검사가 통과했다. 실행자는 구현자와 다른 `qa_round_1`이다. 추가 UI 검수 회차를 만들지 않았고 기존 3회 UI 판정과 실패 원본은 그대로 유지했다.

- 계획 UTC: 2026-10-20T16:25:27.322094+00:00
- 시작 UTC: 2026-10-20T16:25:27.322705+00:00
- 종료 UTC: 2026-10-20T16:27:30.948048+00:00
- npm run check:dev 1회: TypeScript 26개, Python 빌드 경계 9개, PDF 12개 통과
- 실제 RN Web 여정 1회: 12개 시나리오 통과, pageerror 0개
- 독립 Edge 세션에서 격리 fixture로 실행하고 세션 정상 반납
- 기기 조회 및 조작 없음

## 변경과 동일성

AAB의 PKCS7 서명 블록에서 공개 인증서를 OpenSSL로 읽고 지문을 계산하는 경로를 검사했다. 실제 합성 인증서의 양성 사례와 서명 블록 2개를 거절하는 음성 사례가 포함된 Python 검사 9개가 통과했다. 실제 서명 앱 빌드는 이 실행에서 하지 않았다.

이전 UI 검수 후보 1a66d90과 비교해 apps 및 packages Git tree hash가 각각 동일하다. 변경 파일은 문서 2개와 빌드 스크립트 및 해당 검사뿐이다. [비교 근거](source-comparison.json)와 [검사 로그](check-dev.log)에 기록했다.

| 기능 | 실행 결과 | 근거 |
|---|---|---|
| templates | 통과 | [check-dev.log](check-dev.log), [journey.json](journey.json), [contact-layout.png](contact-layout.png), [Paper-bag.png](Paper-bag.png) |
| editing | 통과 | [journey.json](journey.json), [contact-editor.png](contact-editor.png), [editor-ko-small-large-text.png](editor-ko-small-large-text.png) |
| preview | 통과 | [journey.json](journey.json), [contact-layout.png](contact-layout.png), [paper-bag-layout.png](paper-bag-layout.png) |
| pdf | 통과 | [check-dev.log](check-dev.log), [journey.json](journey.json), [pdf-inspection.json](pdf-inspection.json), [Envelope.png](Envelope.png) |
| drafts | 통과 | [journey.json](journey.json), [check-dev.log](check-dev.log) |
| ads | 통과 | [journey.json](journey.json), [check-dev.log](check-dev.log), [home-en.png](home-en.png) |
| locale | 통과 | [journey.json](journey.json), [home-ko-small-large-text.png](home-ko-small-large-text.png), [editor-ko-small-large-text.png](editor-ko-small-large-text.png), [pdf-inspection.json](pdf-inspection.json) |

## templates

6종 실제 생성, 기본값과 프리셋의 A4 및 Letter 치수, 종이 초과 검사와 쇼핑백 분리 절단선 자동 검사가 통과했다. 실제 PDF에서 선을 확인했다.

## editing

6종 앞면 사진 선택과 확대, 앞면 영어 문구와 뒷면 한글 문구 입력, 999 mm 차단 및 60 mm 복구를 실행했다.

## preview

6종 Letter 선택과 반복 토글, 상자 회전 및 카드와 책갈피 반복 배치를 실제 화면에서 확인했다.

## pdf

6개 PDF를 실제 다운로드하고 렌더 및 페이지 정보를 확인했다. A4 및 Letter PDF 12개에서 한글과 영어, 100% 안내와 50 mm 벡터 선 검사도 통과했다.

## drafts

이전 초안과 waves 권한 복원, stars 보상 후 복제와 삭제, 새로고침 후 권한 복구를 실행했다. 저장 트랜잭션과 실패 롤백 검사도 통과했다.

## ads

홈 배너 1개 및 편집, 출력과 완료의 배너 0개, no-fill 이후 무료 PDF와 동의 철회 후 배너 제거를 실제 실행했다. 실제 adapter 코드를 대체 SDK 콜백으로 실행한 중복 동의 조회와 보상 검사도 통과했다.

## locale

한국어와 영어, 한글 PDF, 320×568과 CSS 텍스트 150%에서 문구 입력과 PDF 생성을 실행했다.

## 보존과 남은 범위

기존 round-1, round-2, round-3 manifest의 모든 파일 해시가 그대로임을 확인했다. 새 실행은 artifacts/qa/build-verification에만 기록했다. 실제 Android 광고 SDK, UMP, OS 저장과 공유 및 인쇄, 실물 인쇄 및 조립은 미실행이다.
