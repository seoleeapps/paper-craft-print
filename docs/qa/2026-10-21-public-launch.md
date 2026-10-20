# 1.0.0 개발 검수 기록

검수 후보는 `1a66d90b94e27110667d5211fbf67fc2f4dea51d`다. 원래 checkout의 변경과 `.serena/`는 별도 보존하고 `feat/public-launch` worktree에서 구현했다. 승인 설계와 테스트 계획은 `104af0a24ad192c0a94977360e545c3556c5b807`에 기록했다.

## 독립 실행

구현자 `root`와 다른 검수자 `qa_round_1`이 세 회차를 실행했다. 2회차의 계획상 이름은 `qa_round_2`였지만 실제 실행자는 `qa_round_1`이며 결과에도 그 이름을 보존했다. 개발 환경은 실제 App과 Preview 및 PDF 엔진을 사용하는 RN Web, Microsoft Edge의 회차별 독립 저장소다. 광고 SDK와 OS 기능만 대체 구현이다.

| 회차 | 후보 | 실제 UTC 실행 | 기능과 UX 판정 |
| --- | --- | --- | --- |
| 1 | `39bea11` | 2026-10-20 15:39:10–15:42:47 | 통과, 7개 기능 |
| 2 | `39bea11` | 2026-10-20 15:43:56–15:46:08 | 실패, 쇼핑백 바닥 날개 절단선 누락 |
| 3 최종 재확인 | `1a66d90` | 2026-10-20 16:06:40–16:10:19 | 통과, 7개 기능과 앞선 절단선 결함 해결 |

3회차 최초 후보 `d2e861c`에서는 재사용 브라우저의 초기 데이터와 fixture 기록 시점이 겹친 검수 helper 실패가 있었다. 좁은 진단에서 비동기 복제 직후 즉시 개수를 검사한 helper 실패도 있었다. 제품 코드를 바꾸지 않고 앱 초기화와 화면 갱신 대기를 추가했다. 같은 3회차 안에서 사전 계획한 마지막 전체 재확인을 한 번만 실행했다. 원래 실패 기록과 이전 회차 manifest는 변경하지 않았다.

최종 `check:dev`는 TypeScript 검사 26개, Python 빌드 경계 검사 8개, A4 및 Letter PDF 12개를 통과했다. 실제 화면 여정 12개, 브라우저 오류 0개를 확인했다. 6종 사진과 문구, 방향과 반복 배치, 50 mm 확인선, 종이 초과 차단, 이전 초안과 보상 복구, 복제 및 삭제, 동의 변경과 광고 실패 후 무료 PDF, 한국어와 영어, 320×568 및 CSS 글씨 150%를 실행했다. 저장 JPEG 6,565,536 bytes의 재시작, 복제 및 한 개 삭제 후 사진 해시도 동일했다.

쇼핑백 바닥의 세 경계에 폭 1 mm 절단 틈을 추가했다. 최종 검수자는 닫힌 18개 꼭짓점 외곽, body 끝까지 연결된 틈, 화면과 PDF 렌더를 확인했다. 두께 0의 종이를 전제로 한 접힘 기하에서 앞 날개의 인쇄면과 마지막 뒷 날개의 빈 면이 접촉했다. 실물 인쇄와 조립 결과로 해석하지 않는다.

## 중앙 검사와 공개 CI

중앙 정책 `e7f433c071cf5d3ad4434c02ddf6a12164749489`의 `verify-development-evidence.mjs`에 schema 2 기록을 전달해 `google-play before-build` L3 통과를 확인했다. 실제 경로 `/private/tmp/paper-craft-central`에서 실행했다. schema의 UTC 표기에는 `Z`를 사용하고 원본 결과의 시간대 표현은 보존했다.

[공개 CI](https://github.com/seoleeapps/paper-craft-print/actions/runs/39454315194)는 같은 `1a66d90`에서 통과했다. TypeScript와 구조 검사, 단위 검사, PDF 검사와 RN Web export를 실행한다. CI는 스토어 업로드나 공개를 수행하지 않는다.

실행 원본은 작업 worktree의 `artifacts/qa/round-1`, `round-2`, `round-3`에 있으며 3회차 `recheck`에 최종 화면, PDF와 로그가 있다. schema 2 기록은 `artifacts/development-evidence-1a66d90.json`이다. 원본에서 실패를 삭제하거나 통과로 소급 변경하지 않았다.

## 남은 별도 확인

실제 Android 배너와 UMP SDK 연결, Photo Picker와 파일 저장, 시스템 공유 및 인쇄는 미실행이다. 기기 사용을 승인받기 전 조회하거나 조작하지 않는다. RN Web 결과를 네이티브 통과로 기록하지 않는다. 실물 인쇄 및 조립은 사용자 결정에 따라 출시 조건에서 제외했으며 미확인이다.

## 고정한 AAB 후보와 후속 검증

업로드 후보는 `d1464abc34dfc2f4c0af58a8abc0add97946dc31`다. 빌드 확인 도구를 수정한 뒤 같은 후보에서 구현자와 다른 `qa_round_1`이 2026-10-20 16:25:27–16:27:30 UTC에 전체 개발 검사를 다시 실행했다. TypeScript 26개, Python 9개, PDF 12개와 실제 RN Web 여정 12개가 통과했으며 브라우저 오류는 0개였다. 이전 `1a66d90`과 `apps/` 및 `packages/` Git tree hash가 동일함을 대조했다. 추가 UI 검수 회차는 만들지 않았다.

[최종 실행 결과](launch-1.0.0/build-verification/result.json)와 [기존 3회차 자료](launch-1.0.0/README.md)에 각 실제 SHA와 원본 시간을 보존했다. 중앙 `before-build`, `before-deploy`, `before-release`는 최신 정책 `e7f433c071cf5d3ad4434c02ddf6a12164749489`에서 같은 `d1464ab`의 L3 실행 근거를 통과시켰다. [동일 후보 공개 CI](https://github.com/seoleeapps/paper-craft-print/actions/runs/39457200634)도 통과했다.

독립 검수자 `play_metadata`가 실제 서명 AAB와 APK를 2026-10-20 16:39:41–16:41:22 UTC에 정적 검사했다. 서명, 인증서, 패키지와 버전, 실제 포함 SDK, 권한과 16KB 정렬을 확인했다. 원본 빌드 스크립트의 apksigner 출력 파서 실패를 보존하고 [별도 정적 검증 보고서](launch-1.0.0/static-verification-report.md)를 만들었다. 이후 [PR #3](https://github.com/seoleeapps/paper-craft-print/pull/3)의 파서 수정은 앱 재빌드로 취급하지 않는다.

같은 AAB SHA-256 `32f7596b1a0d841c3a0577603f1ba261a6fe8b07052e1a7ae39129e757f0ac69`가 Play API에 등록됐고 내부 트랙 `1.0.0 (1)`이 completed다. Console에서도 내부 테스트 활성과 기존 테스터 2명을 다시 읽었다. 실제 Android 배너와 UMP, Photo Picker, 폴더 저장과 공유 및 인쇄는 여전히 미실행이다. 심사 제출과 공개도 아직 진행하지 않았다.
