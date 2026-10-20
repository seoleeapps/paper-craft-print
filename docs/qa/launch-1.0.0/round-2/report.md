# 독립 UI 검수 2회차

현재 후보 `39bea11cfac77834d7b253614094e775c4336a3f`의 기능과 UX 종합 판정은 실패다. 종이 쇼핑백 바닥의 절단선 누락을 확인했다. 다른 여정과 오류 복구 검사는 통과했지만 자동 검사 통과만으로 이 조립 결함을 통과로 처리하지 않았다.

- 실제 검수자: qa_round_1, 구현자 root와 독립. 계획의 qa_round_2는 회차 라벨이다.
- 계획 UTC: 2026-10-20T15:43:28.158139+00:00
- 시작 UTC: 2026-10-20T15:43:56.241402+00:00
- 종료 UTC: 2026-10-20T15:46:08.933204+00:00
- 실제 환경: RN Web, 새 독립 Edge, 390×844 및 320×568, 텍스트 CSS 150%
- 전체 검사: check:dev exit 0, 25개 검사 통과, A4 및 Letter PDF 12개 확인
- 실제 화면 여정: 12개 시나리오 통과, pageerror 0개
- 추가 오류 복구와 접근성 여정: 통과
- 추가 쇼핑백 절단선 검사: 실패
- 소유 브라우저 세션 정상 반납, 기기 접근 없음

| 기능 | 기능 | UX | 근거 |
|---|---|---|---|
| templates | fail | fail | [check-dev.log](check-dev.log), [journey.json](journey.json), [paper-bag-cut-audit.json](paper-bag-cut-audit.json), [Paper-bag.png](Paper-bag.png) |
| editing | pass | pass | [journey.json](journey.json), [supplement.json](supplement.json), [range-error.png](range-error.png), [paper-overflow-error.png](paper-overflow-error.png) |
| preview | fail | fail | [contact-layout.png](contact-layout.png), [paper-bag-layout.png](paper-bag-layout.png), [paper-bag-cut-audit.json](paper-bag-cut-audit.json), [Paper-bag.png](Paper-bag.png) |
| pdf | fail | fail | [check-dev.log](check-dev.log), [pdf-inspection.json](pdf-inspection.json), [Envelope.png](Envelope.png), [Gift-box.png](Gift-box.png) |
| drafts | pass | pass | [journey.json](journey.json), [check-dev.log](check-dev.log), [supplement.json](supplement.json), [delete-cancel-draft-retained.png](delete-cancel-draft-retained.png) |
| ads | pass | pass | [journey.json](journey.json), [check-dev.log](check-dev.log), [supplement.json](supplement.json), [home-en.png](home-en.png) |
| locale | pass | pass | [journey.json](journey.json), [supplement.json](supplement.json), [home-ko-small-large-text.png](home-ko-small-large-text.png), [editor-ko-small-large-text.png](editor-ko-small-large-text.png) |

## 발견한 결함

쇼핑백 기본값 50×25×85 mm에서 x=60, 85, 135 mm의 y=95..107.5 mm 구간에 절단선이 없다. 바닥의 앞면, 옆면, 뒷면, 옆면 날개가 이 구간에서 이어져 안내대로 작은 날개를 접고 큰 날개를 겹칠 수 없다. [원본 기하 검사](paper-bag-cut-audit.json), [다운로드 출력 렌더](Paper-bag.png)와 [실제 화면](paper-bag-layout.png)에 보존했다. 교차 코드 검토에서 전달받은 뒤 이 회차에서 독립 재현했다.

root의 수정은 검수 종료 후 시작된다. 이 보고서는 원후보 실패로 보존하며, 수정 후 통과 판정은 별도 계획한 3회차에서 해야 한다. 1회차 판정과 파일은 소급 수정하지 않았다.

## templates

6종 생성과 치수 검사는 통과했지만 쇼핑백 바닥의 세 패널 경계에 bottom..sideBottom 절단선이 없다. 기본값에서 x=60,85,135 mm, y=95..107.5 mm 구간이 누락됐다. 화면 및 PDF의 접기 안내는 바닥 날개를 따로 접도록 안내하지만 현 전개도에서는 날개가 이어져 있다.

## editing

6종 사진과 문구 편집이 동작했다. 범위 밖 값 999와 범위 안 종이 초과 값 90×60×120을 각각 차단하고 50×50×50 복구 후 출력을 허용했다. 오류 안내가 서로 다르고 수정 방법을 보여 준다. 320×568 텍스트 150%에서 입력을 키보드로 수정했고 포커스된 입력 y=431..493은 화면 안에 보인다. Tab 이동은 Choose photo 버튼으로 이어진다.

## preview

6종 Letter 미리보기, 회전 상자와 카드 및 책갈피 반복 배치는 PDF와 일치했다. 그러나 쇼핑백은 바닥 날개 분리에 필요한 절단선이 미리보기에도 없다. 종이 종류, 반복 수량, 100%와 50 mm 안내는 읽을 수 있다. 쇼핑백 조립에 필요한 선이 빠져 안내만으로 조립할 수 없다.

## pdf

브라우저 여정의 PDF 6개와 동의 거절 복구 PDF 1개를 내려받아 렌더링했다. 12개 A4/Letter 개발 PDF의 한글, 영어와 50 mm 벡터 검사는 통과했다. 쇼핑백 PDF는 동일한 바닥 절단선 누락을 포함한다. 사진과 한글 문구, 회전, 반복 배치, 접착 해칭과 출력 안내는 보인다. 쇼핑백은 안내한 조립 방법에 필요한 절단선이 없으므로 출력물 사용성을 통과로 판정하지 않았다.

## drafts

이전 초안과 보상 복원, 복제 및 삭제, 재시작이 동작했다. 삭제 대화상자를 취소하고 새로고침해 초안 수 8개 유지, Legacy 문구와 stars 보상 권한을 확인했다. 복제와 삭제 버튼이 분리되고 삭제 확인을 취소하면 작업이 목록에 유지된다. 이후 편집으로 자연스럽게 복귀했다.

## ads

no-fill 이후 무료 PDF가 동작했다. 동의 거절 후 새로고침에서도 배너 0개였으며 추가 보상 광고는 잠긴 상태를 유지했다. 동의 거절 중 320×568 텍스트 150%에서 무료 PDF를 만들고 내려받았다. 홈 광고 영역은 버튼과 분리돼 있고 광고 오류가 편집이나 출력 버튼을 막지 않는다. 광고는 실제 네이티브 SDK가 아닌 개발 대역이다.

## locale

한국어와 영어 전환, 한글 PDF, 320×568 텍스트 150% 입력과 출력이 동작했다. 키보드 입력과 Tab 이동을 확인했고 마지막 화면에 문서 수평 넘침이 없었다. 큰 글씨는 카드와 문구를 줄바꿈한다. 입력 포커스가 실제 보이며 고정 출력 버튼과 PDF 완료 화면의 저장 버튼을 사용할 수 있다.

## 미검수 범위

- 실제 Android 배너, UMP 및 보상 광고 SDK는 미실행이며 광고는 RN Web 대역이다.
- 파일 선택, 저장, 공유 및 인쇄는 브라우저 대역이다. Android 권한, SQLite와 OS 연결은 미실행이다.
- 키보드 검수는 브라우저 키보드 입력과 Tab 이동이다. Android 화면 키보드는 검수하지 않았다.
- 큰 글씨는 RN Web CSS 150%이며 시스템 글꼴 확대는 미검수다.
- 실물 인쇄 및 조립은 승인 범위에 따라 미확인이다. 기기 조회나 조작을 하지 않았다.

실제 RN Web 전체 여정은 1회 실행했다. 추가 여정은 계획한 오류 복구와 접근성 항목을 확인했으며 실패 원본을 재실행으로 덮어쓰지 않았다.
