# 의존성 보안 검사

2026-10-21 npm lock 설치 직후 26건이 보고되었고 Expo SDK57의 공식 호환 patch 업데이트 후 25건(중간9, 높음16)이 남았다. 원인은 braces의 깊은 패턴 처리, node-forge RSA 검증과 uuid v3/v5/v6의 사용자 buffer 검증 권고 세 개가 상위 패키지로 전파된 것이다. npm 자동 수정 제안은 Expo44와 RN0.72로의 major 변경을 포함하므로 적용하지 않았다.

- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-86w9-cpqp-85rv
- https://github.com/advisories/GHSA-w5hq-g745-h8pq

현재 경로는 Metro 파일 탐색과 Expo CLI, 코드 서명 도구와 Xcode 생성 도구의 전이 의존성이다. 원격 사용자의 glob 패턴, 서명 인증서나 uuid buffer를 앱이 입력받는 기능은 없다. 전체 dependency graph 감사와 실제 Android 번들에서의 포함 여부는 구분한다. 호환성이 확인되지 않은 override로 전이 패키지의 major를 바꾸지 않았다. 최종 AAB 산출물 검토에서도 별도 확인하며 보안 경고0을 주장하지 않는다.

2026-10-21 공개 전 재검사에서 모든 로컬 및 원격 참조의 Git 이력 12커밋과 공개할 작업 파일 103개를 gitleaks로 검사해 비밀값이 검출되지 않았다. 이후 기록 커밋도 staged diff와 전체 이력으로 다시 검사한다. 공개 고객지원 번호는 google-play-publishing 스킬에 지정된 사업용 기본 연락처다. 키와 비밀번호는 저장소 밖 카탈로그에 보관한다.
