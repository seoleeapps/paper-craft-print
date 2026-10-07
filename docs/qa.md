# Android 구축 검증 기록

검증 대상은 Paper Craft Print 0.1.0 / build 1 / `com.seoleeapps.papercraftprint`이다. 스토어 업로드·심사·출시를 수행하지 않았다. 설치 APK는 Google 테스트 광고와 로컬 Android Debug 서명을 사용한다.

## 자동 검사

- `npm run test`: 14개 통과. 치수·안전 여백·반복 배치·잘못된 숫자·사진 자르기·문구 길이/지원 글자/실측 폭, A4·Letter PDF, SQLite 보상 중복·복제·삭제·종료 복구·트랜잭션 실패 복원. 실제 광고 어댑터를 제어된 SDK 콜백으로 실행해 완료·취소·실패·재고 없음·시간 초과·중복 콜백·동의 불가·보상 저장 실패를 검사했다.
- `npm run typecheck`, `npm run check:architecture`: 통과. 코어에 플랫폼 SDK·외부 의존성·기기 전역 접근 없음.
- `npm run verify:pdf`: Poppler로 한글·영문·100%·50 mm 문구를 읽고 실제 벡터 선 길이 50 mm를 검사했다.
- PDF를 PNG로 렌더링해 실제 한글·영문·숫자·자르기/접기 선·접착 표시를 확인했다. 부분 글꼴 삽입에서 글자가 누락된 문제는 정리한 정적 글꼴의 전체 삽입으로 해결했다. 샘플은 `artifacts/pdf/A4.pdf`, `artifacts/pdf/Letter.pdf`.
- 광고 자동 측정 지연을 네이티브 설정에 명시하고 `canRequestAds` 확인 후에만 SDK를 초기화한다. 별도 SQLite 연결에서 외래 키 설정이 사라지는 것을 방지하도록 모든 쓰기를 같은 연결에서 순차 처리한다. [광고 SDK 동의 문서](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent), [Expo 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).
- 운영 설정에서 ID가 누락되면 `Production requires verified Paper Craft Print AdMob IDs`로 설정 검사가 실패했다. 운영 ID는 등록된 이 앱의 ID와 정확히 일치해야 한다.
- Android SDK 36 / min SDK 24 / Expo 57 / RN 0.86.3 / JDK 21 / arm64 APK 빌드 성공. 최종 해시·빌드 기록은 릴리스 원장을 참조한다.

## 개발 중 실기기에서 확인한 항목

Galaxy Note9 SM-N960N / Android 10에서 홈·편집·출력 확인·PDF 완료를 실행했다. Seeker / Android 16에서는 설치와 홈 화면을 확인했다. 이후 다른 작업의 기기 조작이 관찰돼 남은 검증은 전용 에뮬레이터로 분리했다.

이 표는 개발 중 APK의 결과다. 아래 최종 APK의 전체 흐름을 Android 10·16에서 다시 검사했다는 뜻은 아니다.

| 항목 | 결과 | 증거 |
| --- | --- | --- |
| 홈의 핵심 행동 | 화면 아래 고정된 봉투 만들기 버튼 표시 | `artifacts/device/note9-current.png` |
| 편집·출력 화면 | 실제 도안·사진 영역, 종이 위 도안·확인선 표시 | `note9-edit.png`, `note9-output-fixed.png` |
| PDF 생성 | 파일 존재 확인 뒤 완료 화면 표시 | `note9-pdf-latest.png` |
| 앱 강제 종료 | 홈에서 목록을 열어 같은 초안 복구 | `note9-drafts-restored.png` |
| 사진 선택 취소 | 편집·크기·문구 유지 | `note9-photo-cancel.png` |
| 인쇄 창 | 시스템 창 열림. 프린터 사용 불가 표시. 취소 뒤 입력 유지 | `note9-print.png` |
| 보상형 테스트 광고 | Google 테스트 광고 표시·리워드 지급 확인 | `note9-ad-state.png` |
| 보상 뒤 앱 강제 종료 | 다시 실행해 waves 권한 확인, 추가 광고 없이 선택·PDF 생성 | `note9-reward-restored.png`, `note9-unlocked-pdf.png` |
| 광고 선택 거절 | 다른 잠긴 패턴은 잠금 유지, 기존 패턴·PDF 사용 유지 | `note9-ad-declined.png` |

구형 Expo SAF API는 Note9 다운로드 공급자를 쓰기 가능한 URI로 인식하지 못했다. 네이티브 오류와 SDK 소스로 원인을 확인하고 해당 구현을 제거했다. 현재 `Directory.pickDirectoryAsync` / `createFile` / `File.write`를 사용하며 쓴 내용을 다시 읽어 일치 여부를 확인한다. 최종 외부 저장 재검증은 아래에 기록한다.

## 최종 후보 검증

2026-10-05 전용 `PaperCraftPrint_QA_API34` / Android 14 / Google APIs arm64 / Pixel 4 에뮬레이터에서 최종 APK를 설치하고 실행했다. 기본 화면은 1080×2280 px, density 440, 약 393×829 dp다. 작은 화면은 880×1562 px, 약 320×568 dp, 글자 배율 1.5로 검사한 후 원래 설정으로 복원했다. 공유 실기기는 추가로 조작하지 않았다.

APK SHA-256은 `deca99b56bc44fa44b60d8af1988731c732b0f98da3b8a4779fb2157df2eb971`이다. Android Debug 인증서 SHA-256은 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`이다. 패키지·0.1.0/build 1·min 24·target 36·arm64·테스트 AdMob 앱 ID·자동 측정 지연·백업 금지를 APK에서 읽었다. 운영 업로드 키가 아니다. 후보 식별 정보와 소스 지문은 `release/market-launch-state.json`, 빌드 로그는 `artifacts/android/build.log`에 남긴다.

| 항목 | 결과 | 증거 — `artifacts/device/` 기준 |
| --- | --- | --- |
| 시작·초안 복구 | 종료·업데이트 설치 후 같은 크기·문구·사진 복구 | `qa34-home.png`, `qa34-restored-list.png`, `final34-ko-drafts.png`, `final34-ko-restored-photo.png` |
| 사진 방향·자르기 | 자체 EXIF 6 시험 사진의 방향 정규화, 앞·뒷면 각각 이동·1.25배 확대 | `qa34-front-fixed.png`, `../pdf/device-photo-A4.pdf` |
| 크기 검증 | 범위 밖 높이 40 mm에서 출력 차단. 유효한 40×60 mm로 수정 | `qa34-custom-dimensions.png`, `qa34-letter-four-copies.png` |
| 복제·삭제 | 원본 삭제 후 복제 초안과 공유 사진 사본 유지 | `qa34-duplicated.png`, `qa34-deleted-confirmed.png`, `qa34-clone-photo-kept-confirmed.png` |
| 폴더 저장 | Documents 공급자에 쓰고 전체 바이트를 다시 읽어 일치 확인. 저장 완료와 공유 창 열림을 구분 | `qa34-external-saved.png`, `qa34-letter-external-saved.png`, `qa34-rotated-external-saved.png` |
| 저장 취소 | 선택기에서 뒤로 나가 취소 표시. PDF·초안 유지 | `qa34-save-cancel-confirmed.png` |
| 공유·인쇄 취소 | 시스템 공유·인쇄 창이 열린 뒤 취소하고 앱으로 복귀. 한국어 공유 창도 재확인. 실제 외부 전송·인쇄 없음 | `qa34-share-confirmed.png`, `qa34-share-cancelled.png`, `qa34-print-dialog.png`, `qa34-print-cancelled.png`, `final34-ko-share.png` |
| 오프라인 | Wi-Fi·모바일 데이터 끄고 연결 실패 확인 후 A4·Letter PDF 생성·저장 | `qa34-letter-offline-confirmed.png`, `qa34-letter-external-saved.png` |
| 반복·회전 배치 | Letter 40×60 mm 4개, A4 50×60 mm 90도 회전 4개. 축소·잘림 없음 | `qa34-letter-four-copies.png`, `qa34-rotated-pattern-photo.png`, `../pdf/device-photo-Letter.pdf`, `../pdf/device-rotated-A4.pdf` |
| 작은 화면·큰 글자 | 홈 주요 버튼, 출력 종이 선택, 실제 키보드와 입력란·주요 버튼 표시 | `qa34-small-large-text.png`, `qa34-small-output-controls.png`, `qa34-small-keyboard-focused.png` |
| 한국어 | 한국어 설정·안내·개인정보 선택 표시. 한글 PDF는 별도 렌더 검사 | `qa34-ko-settings.png`, `../pdf/A4.pdf` |
| 최종 테스트 광고 | Google 테스트 광고의 Reward granted 확인 후 물결 패턴 사용 | `qa34-test-ad-status.png`, `qa34-reward-after-ad.png` |
| 보상 복구·복제 | 지급 직후 강제 종료·재시작·복제·원본 삭제 후 권한 유지. 재광고 없이 PDF 생성 | `qa34-reward-restored-copy.png`, `qa34-unlocked-pdf.png` |
| TalkBack 부분 확인 | 서비스 연결·터치 탐색 활성과 화면 제목 포커스 확인. 활성 상태에서 ADB 조작으로 제작→PDF 완료 | `qa34-talkback-service.txt`, `qa34-talkback-home-active.png`, `qa34-talkback-primary-focus.png`, `qa34-talkback-pdf-completed.png` |

선택한 면의 미리보기에 옆면이 보이는 SVG 문제는 해당 면의 좌표로 명시적으로 잘라 해결했다. Android edge-to-edge 화면에서 키보드가 입력과 하단 버튼을 가리던 문제는 키보드 높이를 반영하고 실제 입력란·스크롤 화면 좌표를 측정해 보이도록 이동하여 해결했다. 가장 작은 화면·큰 글자에서 입력란 전체가 보이는 실행 화면을 다시 확인했다.

외부 저장한 실제 기기 PDF도 가져와 PNG로 렌더링했다. A4는 595.276×841.89 pt, Letter는 612×792 pt이며, 회전된 사진·문구·열린 패턴이 미리보기와 같은 방향으로 놓였다. 최종 A4 회전 파일은 990,449 바이트, Letter 파일은 996,138 바이트다. 이미지 증거와 PDF는 로컬 `artifacts/`에 보관하며 Git에 포함하지 않는다.

## 남은 범위와 제한

- A4·Letter 실제 인쇄의 50 mm 오차 ±1 mm, 접착·내부 공간·실물 방향은 미검증. 연결 가능한 프린터와 실물 측정 환경이 확인되지 않았다. PDF 치수 통과를 실물 품질 통과로 표현하지 않는다.
- TalkBack 음성을 듣고 실제 탐색·활성화 제스처로 핵심 흐름을 완료하는 사용자 검수는 미확인이다. 음성 없는 에뮬레이터에서 서비스 연결·포커스와 활성 상태의 ADB 실행만 확인했다. 이것을 화면 읽기 전체 통과로 판정하지 않는다.
- 네이티브 저장 공간 부족·폴더 쓰기 실패·광고 재고 없음·EEA 동의 거부는 최종 기기에서 강제로 재현하지 않았다. 광고 어댑터 콜백과 보상 저장 실패·롤백은 자동 검사로 확인했으며, 모든 공급자·기기 오류를 통과했다는 뜻은 아니다. 이전 공개 버전이 없어 공개 버전 업데이트 이관 검사는 해당 없다.
- AdMob 앱과 운영 보상형 단위 등록 완료, 앱 승인 상태는 검토 필요. 운영 광고 송출·매출은 미확인. 이번 APK는 테스트 ID다.
- 스토어용 서명·패키지 소유권 최종 등록·공개 개인정보 페이지·Play 선언·AAB·업로드·심사·공개는 이번 구축 완료와 구분한다.
- 사용자 인터뷰·반복 이용·광고 수익성은 검사하지 않았다.
- npm 감사에 SDK의 전이 의존성 경고가 남아 있다. 호환성을 깨는 Expo/RN 강제 다운그레이드는 적용하지 않았다. 운영 출시 전에 지원 버전의 보안 갱신 경로를 재확인한다.

## 도안 구조·선물 상자 (2026-10-07, `feat/template-registry`)

봉투 전개도를 공통 도안 구조(`TEMPLATES`, `net`)로 옮기고 선물 상자를 추가했다. 위 최종 후보 APK에는 포함되지 않는다.

- `npm run test`: 19개 통과. 선물 상자 전개 크기, 칼선이 끊김 없이 닫히는지, 범위 꼭짓점 조합이 도안 안에 들어가는지, 모든 기본 크기가 A4·Letter에 들어가는지, 범위 밖과 종이 초과의 구분, 예전 초안을 봉투로 여는지, 상자 면 폭 기준 문구 초과 거부를 추가했다.
- `npm run typecheck`, `npm run check:architecture`: 통과.
- `npm run verify:pdf`: 봉투 `A4`·`Letter`, 선물 상자 `tuckBox-A4`·`tuckBox-Letter`에서 한글·영문·100%·50 mm 문구와 50 mm 벡터 선을 확인했다. 상자 PDF를 PNG로 렌더링해 칼선(실선)·접는 선(점선)·풀칠 빗금·패턴 면을 눈으로 확인했다.
- 전용 에뮬레이터는 호스트 부하로 시스템 프로세스가 응답하지 않아 검증에서 제외했다.
- Galaxy Note9 SM-N960N / Android 10에 기존 0.1.0 데이터를 유지한 채 덮어 설치했다. 증거는 `artifacts/device/template/`.

| 항목 | 결과 | 증거 |
| --- | --- | --- |
| 홈 도안 선택 | 봉투·선물 상자 카드와 실제 전개도 썸네일 표시 | `01-home.png` |
| 예전 초안 | 2026-10-05 봉투 초안이 `봉투 · 80 × 120 mm`로 표시되고 열림. 보상으로 연 물결 패턴과 크기 유지 | `02-list.png`, `03-legacy-edit.png` |
| 상자 편집 | 폭·깊이·높이 입력과 기본 크기 3종 표시. 기본 크기 선택과 문구가 앞면 미리보기에 반영 | `04-box-edit.png`, `06-box-preset-text.png` |
| 종이 초과 | 90×50×50 입력 시 A4·Letter 초과 안내, 출력 버튼 비활성 | `05-too-big.png` |
| 출력·PDF | 60×30×90 상자가 A4에 90도 회전 배치되고 점무늬가 모든 면에 표시. PDF 생성 완료 화면 도달 | `07-box-output.png`, `08-box-pdf-done.png` |
| 큰 글자 1.5배 | 홈 카드·목록·상자 치수 입력 3칸이 잘리지 않음. 확인 후 1.0으로 복원 | `09-home-font15.png`, `10-list-font15.png`, `11-box-edit-font15.png` |

- 남은 확인: 출력물의 실제 접기·조립, 상자 초안 복제, 사진을 넣은 상자 PDF.
