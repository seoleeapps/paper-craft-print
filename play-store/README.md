# Google Play 등록 자료

`google-play.config.json`이 등록 문구의 원본이다. 한국어와 영어 소개, 버전별 출시 노트를 포함한다. 계정 소유권과 실제 출시 상태는 설정 파일로 증명하지 않는다. 현재 단계와 후속 절차는 [출시 기록](../docs/google-play-release.md)을 따른다.

`assets/`의 512×512 아이콘과 1024×500 그래픽은 아직 준비되지 않았다. `screenshots/phone/`의 이미지는 실제 앱 실행 화면으로 만든 뒤 설정에 적힌 경로와 대조한다. 웹 개발 환경에서 캡처한 이미지는 Android 설치본 캡처와 구분해 기록한다. 편집, 출력, 저장 기능이 검증되지 않은 이미지를 제출용으로 확정하지 않는다.

개인정보처리방침 원고는 [한국어](policy/privacy-policy.ko.md)와 [영어](policy/privacy-policy.en.md)에 있다. 원고는 공개 페이지가 아니며 URL 게시와 HTTP 응답, 내용 확인을 마친 뒤 제출한다. Data safety 작성 근거와 미확인 항목은 [데이터 문서](../docs/privacy-data.md)에 기록한다.

검사 명령:

```sh
python3 ~/.codex/skills/google-play-publishing/scripts/validate_play_store_config.py --root . --allow-console-gates
```

이 검사는 URL 형식과 로컬 파일을 검사한다. 공개 URL 응답, SDK 동작, Console 제출 완료를 증명하지 않는다. 태블릿 이미지를 준비하지 않을 경우 지원 기기와 현재 Console의 요구를 확인하고 그 판단을 따로 기록한다.
