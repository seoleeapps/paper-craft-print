# Android 산출물 독립 정적검증

상태: 아래 정적 항목 통과. 앱 실행, UMP와 OS 연동은 미실행이다.

- 실제 빌드 소스: `d1464abc34dfc2f4c0af58a8abc0add97946dc31`
- 중앙 정책: `e7f433c071cf5d3ad4434c02ddf6a12164749489`
- 검증 시각: `2026-10-20T16:39:41.609271+00:00`부터 `2026-10-20T16:41:22.597748+00:00`까지
- 개발 근거: `artifacts/development-evidence-d1464ab.json`
- 보고서: `static-verification-report.json`, 실행 명령과 시간은 `commands-with-sdk.json`

| 파일 | 바이트 | SHA-256 |
| --- | ---: | --- |
| `paper-craft-print-1.0.0-1-production-ads.aab` | 49270702 | `32f7596b1a0d841c3a0577603f1ba261a6fe8b07052e1a7ae39129e757f0ac69` |
| `paper-craft-print-1.0.0-1-production-ads.apk` | 70468448 | `56f4196f665a3f1acab00861d7c0d8b9656dac71a8864bc5048ce129a2df923b` |

AAB PKCS7 인증서와 APK v2 인증서의 SHA-256은 둘 다 `63043398b74cd9edf44e1b94549df73f79498ff51c4da96a63ceb06057e5d29e`이다. jarsigner와 apksigner가 실제 파일 서명을 검증했다. 자체 서명 인증서와 timestamp 부재 경고는 원문 로그에 보존했으며 Play 서명이나 승인으로 해석하지 않는다.

패키지는 `com.seoleeapps.papercraftprint`, 버전은 `1.0.0 (1)`, minSdk24, targetSdk36, compileSdk36이다. AAB manifest, APK 패키지 정보, 디버그 비활성, 자동 백업 비활성, 지연 측정 초기화, 운영 AdMob 앱 ID와 포함된 두 광고 단위 ID를 대조했다. 카메라, 마이크, 미디어 전체 접근과 광범위 저장 권한이 없음을 확인했다. 실제 선언 권한 전체는 `manifest-summary.json`에 있다.

세 ABI의 native 파일 51개가 AAB와 APK에서 동일하다. 64비트 파일34개는 모두 LOAD 정렬 `2**14`와 RELRO 조건을 통과했다. APK의 `zipalign -v -c -P 16 4`와 AAB `PAGE_ALIGNMENT_16K`가 통과했다. DEX와 JavaScript 산출물도 두 파일에서 동일하다. [Android 공식 16KB 안내](https://developer.android.com/guide/practices/page-sizes)를 기준으로 정적 검사했으며16KB 환경 실행 결과는 아니다.

실제 서명 AAB의 dependency graph와 포함된 속성에서 GMA25.4.0, UMP4.0.0, Ads identifier18.0.0, RN0.86.3과 AGP8.12.0을 읽었다. 이전1a 빌드의 merger report를 현재 후보의 근거로 사용하지 않았다.

중앙 `before-deploy`는 같은 소스 `d1464abc34dfc2f4c0af58a8abc0add97946dc31`에서 L3 근거 통과를 반환했다. 세부 명령과 출력은 `central-before-deploy.txt` 및 JSON에 있다.

원본 `build-report.json`은 없다. Gradle 빌드 성공 후 기존 확인 코드가 새로운 `V2 Signer` 출력 형식을 처리하지 못해 종료한 상태를 유지한다. 원본 파일과 실패 로그를 보존하고 별도 독립검증 보고서로 정적 확인 결과를 기록했다.

산출물의 VCS 메타데이터는 `NO_SUPPORTED_VCS_FOUND`다. Git archive 작업 공간을 사용한 빌드의 소스 연결은 실제 빌드 호출과 후보 기록, clean HEAD 확인, 위 파일 해시에 근거한다. 이 보고서를 최신 main SHA의 재빌드 증거로 바꾸면 안 된다.

기기 조회와 조작, 앱 실행, 실제 배너, UMP, 시스템 사진 선택, 폴더 저장, 공유, 인쇄,16KB 환경 실행은 하지 않았다. 업로드, 처리, 심사 제출, 승인과 공개도 이 검사의 범위 밖이다.
