const { withAppBuildGradle } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * 로컬 gradle 릴리스 빌드가 디버그 키 대신 실제 릴리스 키스토어로 서명하도록
 * android/app/build.gradle 을 수정한다. 키 정보는 프로젝트 루트의 credentials.json
 * (EAS와 동일 소스)에서 읽는다. prebuild 마다 자동 재적용된다.
 *
 * credentials.json 이 없으면(키 없는 환경) 아무것도 안 하고 기본(디버그) 유지.
 */
module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    const credFile = path.join(cfg.modRequest.projectRoot, "credentials.json");
    if (!fs.existsSync(credFile)) return cfg;

    const ks = JSON.parse(fs.readFileSync(credFile, "utf8"))?.android?.keystore;
    if (!ks || !ks.keystorePath) return cfg;

    let src = cfg.modResults.contents;
    const keystoreName = path.basename(ks.keystorePath);

    // 1) signingConfigs 에 release 블록 주입 (멱등 — 주입 마커로 판별)
    if (!src.includes("storeFile rootProject.file")) {
      src = src.replace(
        /signingConfigs\s*\{/,
        `signingConfigs {
        release {
            storeFile rootProject.file("../${keystoreName}")
            storePassword "${ks.keystorePassword}"
            keyAlias "${ks.keyAlias}"
            keyPassword "${ks.keyPassword}"
        }`
      );
    }

    // 2) release 빌드타입의 서명을 debug → release 로 교체
    //    (Expo 템플릿의 Caution 주석 바로 뒤 라인을 앵커로 사용해 정확히 한 곳만)
    src = src.replace(
      /(see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\s*\n\s*signingConfig signingConfigs\.)debug/,
      "$1release"
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
