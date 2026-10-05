# Paper Craft Print

성인 취미 사용자의 사진과 짧은 문구로 납작 봉투를 만들고 A4·Letter PDF를 저장·공유·인쇄하는 Android 앱입니다.

```sh
npm ci
npm run test
npm run typecheck
npm run check:architecture
./scripts/build-android.sh
```

Node 24, Android SDK 36, Android Studio의 JDK 21이 검증 환경입니다. 설치용 APK는 `artifacts/android/paper-craft-print-0.1.0-test-ads.apk`에 생성됩니다. arm64 기기용, 테스트 광고, 로컬 검증용 서명입니다. 스토어 제출용 서명·AAB·심사·공개는 별도 단계입니다.

```sh
adb -s DEVICE_SERIAL install -r artifacts/android/paper-craft-print-0.1.0-test-ads.apk
adb -s DEVICE_SERIAL shell am start -n com.seoleeapps.papercraftprint/.MainActivity
```

`apps/mobile`은 React Native 화면과 기기 서비스, `packages/product-core`는 순수 도안·배치·사진 자르기 계산과 포트입니다. 제품 범위는 [구축 계약](docs/product-spec.md), 실행 증거와 남은 검증은 [QA 기록](docs/qa.md), 광고 상태는 [AdMob 원장](release/admob.json), 제품 상태는 [제품 원장](release/app-launch-ledger.json), 현재 APK와 마켓 단계는 [후보 원장](release/market-launch-state.json)을 참조하세요. PDF 검사에는 Poppler의 `pdftotext`·`pdftocairo`가 필요합니다. APK·PDF·화면 증거는 로컬 `artifacts/`에 보관하며 Git에 포함하지 않습니다.

서버·계정·Firebase·이용 분석·결제는 사용하지 않습니다. 데이터는 기기에 보관되며 앱 삭제 시 없어집니다. 선택적 광고는 동의 상태가 허용할 때만 요청합니다. 무료 제작은 광고 없이 이용할 수 있습니다.
