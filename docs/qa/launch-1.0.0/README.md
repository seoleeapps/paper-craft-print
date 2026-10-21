# 1.0.0 검수 자료

현재 앱 후보는 `d1464abc34dfc2f4c0af58a8abc0add97946dc31`다. 원본 산출물과 전체 화면 및 실행 로그는 보존한 `public-launch/artifacts/` 작업 공간에 있다. 이 폴더에는 공개 가능한 계획, 결과, 보고서, 파일 해시 목록과 Console 및 API 조회 결과의 사본을 모았다. 보고서의 일부 상대 링크는 원본 로그나 이미지 경로이며 이 폴더에 해당 바이너리를 복사하지 않았다.

| 자료 | 범위 |
| --- | --- |
| `round-1/` | 독립 UI 검수 1회차, `39bea11`, 통과 |
| `round-2/` | 독립 UI 검수 2회차, `39bea11`, 쇼핑백 절단선 실패 보존 |
| `round-3/` | 독립 UI 검수 3회차 최종 재확인, `1a66d90`, 통과 |
| `build-verification/` | 최종 `d1464ab` 개발 환경 L3 실행, UI 4회차가 아님 |
| `static-verification-report.json` 및 `.md` | 실제 서명 AAB와 APK의 독립 정적 검사. 앱 실행은 미실행 |
| `manifest-summary.json` | 실제 패키지, 버전, SDK, 메타데이터와 권한 |
| `play-internal-readback.json` | 업로드 AAB 해시와 internal completed, production release 없음 |
| `play-listing-verified.json` 및 `play-listing-ko-verified.json` | 실제 등록 API 조회 |
| `play-production-countries.json` | Console 국가 설정 178개 타겟팅됨. 공개 배포 근거가 아님 |
| `play-content-overview.txt` | 앱 콘텐츠의 주의 필요 목록 없음 |
| `play-data-safety-preview.txt` | 실제 저장한 수집 및 공유 답안 미리보기 |
| `admob-store-link-unavailable.txt` | 정확한 패키지 검색에서 연결 가능한 앱 없음 |

최종 중앙 검증 근거 `development-evidence-d1464ab.json`을 함께 보관했다. 이 파일은 앱 후보의 실행 근거이며 이 문서 커밋이나 이후 main의 검수로 소급하지 않는다. 실제 기기 SDK와 OS 연동은 승인 대기로 미실행, 실물 인쇄와 조립은 출시 조건에서 제외되어 미확인이다.

Data safety CSV는 공개 사본에서 줄바꿈을 LF로 통일하고 질문 표시문의 끝 공백만 정리했다. 질문 ID, 응답 ID, 응답 값과 필수 여부 열은 실제 가져온 원본과 동일함을 대조했다. 원본 CSV와 Console 답안은 변경하지 않았다.

`metadata-validation.json`의 제품 원장 구조 검사는 통과했다. 제품 원장 전체 검사와 공개 완료 검사는 아직 미완료이며 각 종료 코드와 남은 항목을 그대로 보존했다.

`submission/`에는 후속 심사 제출 지시에 따른 실제 API 시도와 국가 및 파일 재조회, 양언어 등록정보 비교를 보관했다. API 거절과 Console 재로그인 대기이며 제출 완료 근거는 아니다. 태그는 v1.0.0으로 고정했고 GitHub Release는 draft다.
