# 데이터와 SDK 목록, Google Play 신고 검토 자료

앱은 초안과 설정을 SQLite, 선택한 사진 사본과 PDF를 앱의 지속 저장 폴더에 보관한다. 서버 업로드·로그인·이용 분석·Firebase·결제는 없다. 사용자가 선택한 시스템 폴더에 PDF를 저장하고 시스템 공유·인쇄 창에 파일을 전달할 수 있다. 초안 삭제 시 다른 초안이 참조하지 않는 사진을 정리한다. 앱 삭제 시 내부 데이터는 삭제되며 외부에 저장·공유한 파일은 남는다. Android 자동 백업은 비활성화했다.

Google Mobile Ads와 UMP는 홈과 내 작업의 배너, 선택적 보상형 광고, 지역에 따른 동의를 처리한다. 앱 시작 시 광고 자동 측정을 지연하고 동의 상태의 `canRequestAds` 확인 뒤 SDK를 초기화한다. 광고 동의 불가, 오류, 취소 시 무료 패턴으로 제작하고 PDF를 만들 수 있다. 광고 보상은 서버 검증을 사용하지 않는 로컬 패턴 권한이다. 편집, 출력 확인과 완료 화면에는 배너를 표시하지 않는다.

사진은 Android 시스템 Photo Picker를 이용하며 미디어 전체 접근·카메라·마이크 권한을 요청하지 않는다. 폴더 저장은 Storage Access Framework에서 사용자가 선택한 디렉터리 권한을 이용한다. 광범위 저장 권한은 차단한다.

개인정보처리방침 공개 페이지, Play Data safety, 등급, 대상 연령과 광고 선언은 아직 제출 완료로 확인하지 않았다. [한국어 원고](../play-store/policy/privacy-policy.ko.md)와 [영어 원고](../play-store/policy/privacy-policy.en.md)는 공개 전 검토 자료다. 예정 URL은 `https://www.seorilabs.com/apps/paper-craft-print/privacy/`이며 게시 여부와 HTTP 응답은 미확인이다.

## Data safety 작성 근거

아래는 2026-10-21 소스와 공식 자료를 읽고 만든 초안이다. 실제 Console 답안 또는 최종 AAB의 선언 검증 결과가 아니다. 광고 SDK를 포함하므로 앱 전체를 `수집 또는 공유 없음`으로 신고하지 않는다.

| 데이터 | 앱의 처리와 신고 검토 |
| --- | --- |
| 사진, 입력 문구와 초안 | 기기에서 편집하고 PDF를 만든다. 앱 운영자의 서버로 전송하지 않는다. 사용자가 외부 공유한 파일은 수신 앱에서 처리 |
| 언어와 도안 설정, 패턴 권한 | 기기에 보관. 앱 서버와 별도 분석 서비스 전송 없음 |
| 광고 SDK 데이터 | Google 공식 공개 목록의 IP 기반 대략적 위치, 광고 상호작용, 진단 정보, 기기 식별자 범주를 최종 SDK와 대조 |
| 로그인, 결제, 연락처 | 관련 기능 없음. 계정 생성이나 계정 삭제 URL 요구 여부는 현재 Console 질문과 대조 |

Google Mobile Ads 공식 안내는 광고, 분석과 부정 이용 방지 목적의 자동 수집과 공유, TLS 전송을 설명한다. 여기의 분석 목적은 광고 제공자의 처리이며 Firebase나 별도 제품 이용 분석을 추가했다는 뜻이 아니다. 수집의 필수 또는 선택 여부, 일시 처리, 공유 예외, 각 세부 목적과 삭제 답안은 최종 SDK 설정과 현재 Console 정의를 대조해 확정한다. 광고 동의를 받을 수 있다는 사실만으로 모든 수집을 선택 사항으로 표시하지 않는다.

현재 잠금 파일의 React Native 래퍼는 `react-native-google-mobile-ads 17.2.0`이다. 설치된 래퍼의 기본 Android classic SDK 선언은 Google Mobile Ads `25.4.0`, UMP `4.0.0`이다. 2026-10-21 조회한 Google 공개 목록은 최신 `25.5.0`을 설명한다. 최종 Gradle resolved dependency와 AAB의 실제 SDK 버전은 아직 대조하지 않았으므로 이 차이를 해소하기 전 Data safety를 확정하지 않는다. 추가 중개 광고 SDK는 소스에서 확인하지 않았으며 최종 의존성 검사에서 다시 확인한다.

Android 자동 백업 비활성화는 앱 설정에서 확인한 상태다. 최종 병합 manifest의 `allowBackup`, 차단 권한, 광고 ID 권한, 네트워크와 SDK 설정을 AAB에서 다시 읽어야 한다. 네이티브 Photo Picker, 폴더 저장, 공유와 인쇄 동작은 개발 환경 검수 결과와 별도로 남겨 두고 실제로 실행하지 않은 항목을 통과로 쓰지 않는다.

## 삭제 범위

초안 삭제와 앱 데이터 삭제는 범위가 다르다. 초안 삭제 후 다른 초안에서 사용하지 않는 사진 사본은 정리하지만, 이미 생성한 앱 내부 PDF는 초안 삭제로 지우지 않는다. 앱 삭제 또는 앱 데이터 삭제 시 내부 초안, 사진, 설정, 권한과 PDF가 삭제된다. 사용자가 외부에 저장하거나 공유한 PDF는 그 위치에서 직접 삭제해야 한다. 광고 제공자 데이터의 보관과 삭제는 Google 정책과 제공되는 제어 수단을 따른다.

## 제출 전 남은 확인

1. 최종 AAB의 SDK 버전, 광고 설정과 권한을 공식 공개 목록과 대조한다.
2. 공개 개인정보처리방침의 시행일, 연락처와 운영 주체 표시를 확인하고 게시 뒤 HTTP 200과 실제 내용을 읽는다.
3. 각 데이터 유형의 수집, 공유, 목적, 필수 여부, 일시 처리, 암호화와 삭제 답안을 현재 Play Console 정의로 확정한다.
4. Data safety 작성과 IARC, 대상 연령 18세 이상, 광고 포함 저장 후 실제 필드와 상태를 다시 읽는다. 읽기 전에는 완료 표기를 남기지 않는다.

## 공식 참고 자료

- [Google Mobile Ads 데이터 공개 안내](https://developers.google.com/admob/android/privacy/play-data-disclosure), 2026-10-21 조회
- [UMP Android 안내](https://developers.google.com/admob/android/privacy), 2026-10-21 조회
- [Google Play Data safety 작성 안내](https://support.google.com/googleplay/android-developer/answer/10787469), 2026-10-21 조회
- [Google Play 사용자 데이터 정책](https://support.google.com/googleplay/android-developer/answer/10144311), 2026-10-21 조회
