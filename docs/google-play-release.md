# Paper Craft Print Google Play 출시 기록

2026-10-21 09:41 KST에 `1.0.0 (1)`을 Google Play 프로덕션 심사로 제출했다. 제출 ID는 `1`이며 제출 활동과 세부정보에서 `검토 중`을 읽었다. 무료, 국가177개 및 기타 국가, 전체 출시 설정이다. 관리형 게시가 꺼져 있어 승인 후 자동 공개된다. 현재 공개 스토어의 미국 및 한국 조회는 HTTP404이며 승인 또는 공개 완료를 뜻하지 않는다. 개발 환경 L3와 산출물 정적 검증은 통과했으며 실제 Android SDK 및 OS 실행과 실물 인쇄 및 조립은 미확인이다.

## 고정한 출시 대상

| 항목 | 값 |
| --- | --- |
| 앱과 패키지 | Paper Craft Print, `com.seoleeapps.papercraftprint` |
| 계정 | Seolee Apps 개인 계정, 개발자 ID `5547060480954653351` |
| Console 앱 | `4975681274275501151` |
| 버전 | `1.0.0`, `versionCode 1` |
| 실제 빌드 소스 | `d1464abc34dfc2f4c0af58a8abc0add97946dc31` |
| 공개 목표 | Google Play, 무료, 배포 가능한 전 세계 국가, 100% |
| 국가 설정 | Console의 178개 행 모두 타겟팅됨. 기타 국가와 부속 지역 포함 |
| 태그 | `v1.0.0`, 실제 앱 후보 `d1464ab`로 고정. GitHub Release는 draft |
| 언어와 대상 | 한국어와 영어, 성인 취미 사용자 |

계정 확인 잠금은 해제됐고 동일 계정에서 앱을 생성했다. 사용자 지정 계정과 패키지를 유지했다. 공개 저장소는 [seoleeapps/paper-craft-print](https://github.com/seoleeapps/paper-craft-print)다. 기능 [PR #2](https://github.com/seoleeapps/paper-craft-print/pull/2)와 최신 apksigner 출력 지원 [PR #3](https://github.com/seoleeapps/paper-craft-print/pull/3)을 병합했다. PR #3은 이후 빌드 도구 수정이며 업로드한 앱의 소스 SHA를 바꾸지 않는다.

실물 인쇄와 조립은 승인 범위에 따라 출시 조건에서 제외하고 미확인으로 남긴다. iOS, 앱인토스, 로그인, 서버, Firebase, 별도 제품 이용 분석과 결제는 추가하지 않았다. 원래 checkout의 접이식 카드 변경과 `.serena/`는 보존했다.

## 개발 검수와 서명 산출물

[개발 검수 기록](qa/2026-10-21-public-launch.md)에 독립 검수 3회와 최종 후보 실행을 구분했다. 2회차 쇼핑백 절단선 실패를 보존하고 3회차에서 해결했다. 최종 `d1464ab`에서 TypeScript 26개, Python 9개, PDF 12개와 실제 RN Web 여정 12개가 통과했다. 광고와 OS 대체 구현의 결과를 네이티브 실행으로 해석하지 않는다.

최신 중앙 정책 `e7f433c071cf5d3ad4434c02ddf6a12164749489`로 같은 후보의 `before-build`, `before-deploy`, `before-release` L3 검증을 실제 실행해 통과했다. 별도로 남긴 필수 Android SDK 및 OS 항목은 아직 실행하지 않았다. 중앙 검증 통과만으로 해당 항목을 통과로 바꾸지 않는다.

| 파일 | 크기 | SHA-256 |
| --- | ---: | --- |
| `paper-craft-print-1.0.0-1-production-ads.aab` | 49,270,702 bytes | `32f7596b1a0d841c3a0577603f1ba261a6fe8b07052e1a7ae39129e757f0ac69` |
| `paper-craft-print-1.0.0-1-production-ads.apk` | 70,468,448 bytes | `56f4196f665a3f1acab00861d7c0d8b9656dac71a8864bc5048ce129a2df923b` |

전용 업로드 키의 local 및 BeeStation 암호화 백업 두 곳 모두 임시 복원 검사를 통과했다. 키와 비밀번호는 저장소 밖 카탈로그에 보관한다. 인증서 SHA-256은 `63043398b74cd9edf44e1b94549df73f79498ff51c4da96a63ceb06057e5d29e`다.

[독립 정적 검증](qa/launch-1.0.0/static-verification-report.md)에서 실제 서명, 패키지, 버전, targetSdk36, 디버그 및 자동 백업 비활성, 운영 광고 ID와 권한을 대조했다. 64비트 ELF 34개와 APK ZIP 및 AAB 16KB 정렬을 확인했다. 16KB 환경에서 앱을 실행한 근거는 아니다. GMA25.4.0, UMP4.0.0, Ads identifier18.0.0은 실제 AAB 의존성에서 읽었다.

Gradle 빌드는 성공했지만 기존 검증 코드가 Build Tools37의 `V2 Signer` 출력을 처리하지 못해 빌드 스크립트가 실패했다. 원본 `build-report.json`은 없으며 실패 로그와 완료 파일을 보존했다. 별도 독립 검증으로 서명 일치를 확인했다. PR #3에서 파서를 고쳤고 Python 10개 및 공개 CI가 통과했다. 이를 새 앱 빌드로 기록하지 않는다.

## Play에 저장하고 다시 읽은 내용

| 항목 | 실제 상태와 근거 |
| --- | --- |
| 내부 테스트 | versionCode1, `1.0.0 (1)`, API `completed`, Console 활성 상태 |
| 대상 테스터 | 기존 내부테스트 그룹 2명 선택, 다시 읽어 확인 |
| 업로드 파일 | API의 AAB SHA-256이 위 로컬 파일과 동일 |
| 소개와 이미지 | en-US와 ko-KR 소개, 언어별 아이콘과 그래픽 및 휴대전화 화면 3개 |
| 카테고리와 지원 | 예술/디자인, `cs@seorilabs.com`, 사업용 전화번호와 공식 사이트 |
| 개인정보처리방침 | 영어 공개 URL 저장, 한국어와 영어 페이지 HTTP200 및 제품 내용 확인 |
| 앱 콘텐츠 | 광고 포함, 로그인 제한 없음, 대상 18세 이상, 광고 ID 사용. 정부, 금융, 건강 기능 없음 |
| IARC | 완료. ESRB Everyone, PEGI3, USK0, ClassInd Livre, IARC3, 한국3세 이상 |
| Data safety | 실제 SDK와 공식 공개 자료를 대조한 CSV를 가져오고 저장 결과 확인 |
| 국가 | 프로덕션 국가 설정 178개 타겟팅됨. 실제 공개 배포를 뜻하지 않음 |
| 공개 심사와 배포 | 제출1, 1.0.0(1), 검토 중. API production completed는 공개 완료가 아님 |

[내부 테스트 참여 링크](https://play.google.com/apps/internaltest/4701734928185552472)는 지정된 테스터용이다. 현재 표시는 검토 전 임시 이름일 수 있다. 사용자 테스트 확인은 다음 단계의 승인 조건이 아니다.

등록 설정 검사는 `validate_play_store_config.py --root . --allow-missing-tablet --json`으로 통과했다. 태블릿 스크린샷은 준비하지 않았으며 이 옵션을 숨기지 않는다. 실제 등록 화면은 RN Web 실행 화면이며 Android 광고와 OS 화면 근거가 아니다. 정책 신고 근거는 [데이터와 SDK 기록](privacy-data.md), 저장 CSV는 [Data safety](../play-store/policy/data-safety.csv), API와 Console 기록은 [검수 자료 안내](qa/launch-1.0.0/README.md)에 있다.

공개 개인정보 페이지:

- [한국어](https://www.seorilabs.com/apps/paper-craft-print/privacy/)
- [영어](https://www.seorilabs.com/en/apps/paper-craft-print/privacy/)

## AdMob 상태

기존 앱과 보상형 단위를 유지하고 `home_drafts_banner`를 등록했다. 이 앱 한 개만 대상으로 GDPR 및 미국 주별 동의 메시지를 게시했다. GDPR 기본 언어는 영어이며 거부 선택을 제공한다. 미국 메시지는 지원되는 현재 및 향후 주를 대상으로 한다.

정확한 패키지로 Play 앱을 검색했으나 일치 항목이 없어 스토어 연결을 저장하지 못했다. 앱은 검토 필요와 광고 게재 제한 상태다. 앱별 app-ads.txt 인증, 준비 상태 승인, 현재 후보의 SDK 요청 및 실제 운영 광고 표시는 미확인이다. [AdMob 기록](../release/admob.json)에 0.1.0의 과거 보상 광고 검수와 현재 미실행 상태를 구분했다. 광고 오류나 재고 없음이 무료 도안과 PDF 제작을 막지는 않는다.

## 현재 심사와 남은 확인

1. Console 제출1에서 현재 후보 1.0.0(1)과 변경사항12개, `검토 중`을 확인했다. 첫 게시 개요 조회에는 검토 전 빠른 검사가 실행 중이었다. 제출 활동의 상태와 별도로 기록한다.
2. 관리형 게시 사용 중지와 전체 출시 설정을 유지했다. Google 승인 후 자동 공개되는 흐름이며 아직 승인되지 않았다. 공개 스토어의 패키지, 버전과 국가별 이용 가능 상태를 다시 읽어야 공개 완료다.
3. Android SDK와 OS 연동은 기기 사용 승인 및 실행 없이 미확인으로 보존한다. AdMob 스토어 연결, 앱 승인과 운영 송출은 별도로 확인한다. 실물 인쇄와 조립은 출시 조건에서 제외되어 미확인이다.

현재 상태의 정본은 [후보별 출시 원장](../release/market-launch-state.json)이다. 공개 완료 검사에는 QA, 승인, 공개와 공개 확인이 남아 있다. 원장의 연속 단계 계산상 state는 processing이지만 제출 gate는 실제 증거로 pass이며 제출1 상태는 검토 중이다.

## 2026-10-21 심사 제출 시도

네이티브 미실행 상태를 안내받은 뒤 사용자가 `심사제출해`라고 지시했다. 기기를 조회하거나 조작하지 않았고 네이티브 미실행을 통과로 바꾸지 않았다. 이 지시는 현재 후보의 심사 전송에 반영하며 이전 검수 결과를 다시 쓰지 않는다.

실제 API 재조회에서 production release 없음, AAB 해시 일치, 국가177개 및 restOfWorld=true를 확인했다. 한국어와 영어 등록정보는 각11개 비교 항목이 일치했고 두 개인정보 페이지의 HTTP200과 제품 및 패키지를 확인했다. 같은 후보의 중앙 before-release L3도 다시 통과했다.

API의 production update는 임시 편집에서 수락됐지만 validate가 HTTP400 `Only releases with status draft may be created on draft app.`으로 거절했다. commit은 호출하지 않았고 임시 편집을 삭제했다. 새 API 조회에서도 production release는 없다. 당시 실제 심사 제출을 완료하려면 Console에서 첫 출시 전송이 필요했다. Google 자동 로그인은 provider_blocked 상태여서 전용 수동 로그인 창을 열고 사용자 재인증을 요청했다. 이 첫 시도는 미제출 이력으로 유지하며 후속 성공 기록과 구분한다. [시도와 실제 재조회](qa/launch-1.0.0/submission/)를 보존한다.

## 2026-10-21 Console 심사 제출 완료

사용자의 로그인 완료 응답 뒤 실제 Google identity, Seolee Apps 개인 계정과 개발자 ID 및 앱 소유를 다시 확인했다. 기존 내부 테스트 AAB versionCode1을 라이브러리에서 선택하고 동일 출시명과 en-US 및 ko-KR 노트를 입력했다. 제출 직전 국가178행이 모두 타겟팅됨을 읽었다.

출시 미리보기에는 가독화 파일 경고1개와 차단 오류0개가 있었다. 이 후보는 R8 난독화를 켜지 않았으며 가짜 매핑 파일을 추가하지 않았다. 게시 개요의 변경사항12개와 전체 출시, 관리형 게시 사용 중지를 확인한 뒤 전송했다. Console은 변경사항12개 전송 완료를 표시했고 [제출1](https://play.google.com/console/u/0/developers/5547060480954653351/app/4975681274275501151/publishing/submission-activity/1/details)에 2026-10-21 09:41, 소스 Play Console, 상태 검토 중이 기록됐다.

[제출 조회 JSON](qa/launch-1.0.0/submission/play-review-submission-1.json), [제출 세부정보](qa/launch-1.0.0/submission/submission-1-details.txt)와 [제출 후 API 조회](qa/launch-1.0.0/submission/publisher-after-submit.json)를 보존했다. API의 production completed는 전체 출시 의도이며 Google 심사 승인이나 공개 완료를 뜻하지 않는다. AAB 해시는 기존 고정 파일과 같고 미국 및 한국 공개 페이지는 HTTP404다. 기기를 조회하거나 조작하지 않았다.
