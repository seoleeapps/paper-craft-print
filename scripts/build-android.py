#!/usr/bin/env python3
"""Signed AAB and QA APK build; never accesses devices or uploads artifacts.

Requires CRAFT_DEVELOPMENT_EVIDENCE and SEORILABS_POLICY_ROOT. Ads default to test.
Set BUNDLETOOL_JAR for direct packaged AAB manifest verification.
"""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import uuid
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE, VERSION, CODE = "com.seoleeapps.papercraftprint", "1.0.0", 1
ABIS = {"arm64-v8a", "armeabi-v7a", "x86_64"}
KEY_DIR = Path.home() / ".config/seorilabs/play-store/paper-craft-print"
ANDROID = "{http://schemas.android.com/apk/res/android}"
SIGNING_INIT = """allprojects { project ->
    project.plugins.withId('com.android.application') {
        project.extensions.getByName('androidComponents').finalizeDsl { android ->
            def required = { name ->
                def value = System.getenv(name)
                if (!value) throw new GradleException('Missing signing environment: ' + name)
                value
            }
            def signing = android.signingConfigs.maybeCreate('release')
            signing.storeFile = new File(required('CRAFT_UPLOAD_KEYSTORE_PATH'))
            signing.storeType = required('CRAFT_UPLOAD_KEYSTORE_TYPE')
            signing.keyAlias = required('CRAFT_UPLOAD_KEY_ALIAS')
            signing.storePassword = required('CRAFT_UPLOAD_STORE_PASSWORD')
            signing.keyPassword = required('CRAFT_UPLOAD_KEY_PASSWORD')
            android.buildTypes.getByName('release').signingConfig = signing
            android.buildTypes.getByName('release').debuggable = false
        }
    }
}
"""


class BuildError(Exception):
    pass


def run(args, cwd=ROOT, env=None, log=None, secrets=(), input_bytes=None):
    result = subprocess.run(args, cwd=cwd, env=env, capture_output=True, input=input_bytes)
    output = result.stdout.decode("utf-8", errors="replace")
    diagnostic = result.stderr.decode("utf-8", errors="replace")
    for secret in sorted(set(secrets), key=len, reverse=True):
        if secret:
            output = output.replace(secret, "[redacted]")
            diagnostic = diagnostic.replace(secret, "[redacted]")
    if log:
        Path(log).write_text(output + diagnostic)
    if result.returncode:
        # Signing diagnostics are kept only in the redacted log, never raw exceptions.
        if not secrets:
            print((output + diagnostic)[-6000:], file=sys.stderr)
        raise BuildError(f"{Path(args[0]).name} failed with exit code {result.returncode}")
    return output


def clean_head(root):
    if run(["git", "status", "--porcelain", "--untracked-files=all"], cwd=root).strip():
        raise BuildError("Build requires a clean checkout including untracked files")
    return run(["git", "rev-parse", "HEAD"], cwd=root).strip()


def gate(root, env):
    if not env.get("CRAFT_DEVELOPMENT_EVIDENCE") or not env.get("SEORILABS_POLICY_ROOT"):
        raise BuildError("Set CRAFT_DEVELOPMENT_EVIDENCE and SEORILABS_POLICY_ROOT")
    evidence = Path(env["CRAFT_DEVELOPMENT_EVIDENCE"]).expanduser().resolve()
    policy = Path(env["SEORILABS_POLICY_ROOT"]).expanduser().resolve()
    verifier = policy / "scripts/release/verify-development-evidence.mjs"
    if not evidence.is_file() or not verifier.is_file():
        raise BuildError("Development evidence or central verifier is missing")
    evidence_bytes = evidence.read_bytes()
    sha, policy_sha = clean_head(root), clean_head(policy)
    remote = run(["git", "ls-remote", "origin", "HEAD"], cwd=policy).split()
    if not remote or remote[0] != policy_sha:
        raise BuildError("SEORILABS_POLICY_ROOT must be the current remote default HEAD")
    print(f"Checking central before-build gate for {sha}", flush=True)
    run(["node", str(verifier), "--file", str(evidence), "--repo", "seoleeapps/paper-craft-print",
         "--sha", sha, "--target", "google-play", "--phase", "before-build"], cwd=root, env=env)
    if evidence.read_bytes() != evidence_bytes:
        raise BuildError("Development evidence changed during validation")
    return sha, policy_sha, hashlib.sha256(evidence_bytes).hexdigest()


def advertising_env(root, mode, env):
    result = env.copy()
    # Keep credentials out of npm, Expo and other non-signing child processes.
    for name in list(result):
        if name.startswith("CRAFT_UPLOAD_"):
            result.pop(name)
    result["CRAFT_AD_MODE"] = mode
    fields = {"androidAppId": "ADMOB_APP_ID", "rewardedAdUnitId": "ADMOB_REWARDED_AD_UNIT_ID",
              "bannerAdUnitId": "ADMOB_BANNER_AD_UNIT_ID"}
    for variable in fields.values():
        result.pop(variable, None)
    if mode == "production":
        data = json.loads((root / "release/admob.json").read_text())
        for field, variable in fields.items():
            value = data.get(field, "")
            separator = "~" if field == "androidAppId" else "/"
            pattern = r"ca-app-pub-\d{16}" + re.escape(separator) + r"\d{10}"
            if not re.fullmatch(pattern, value) or value.startswith("ca-app-pub-3940256099942544"):
                raise BuildError(f"Production requires registered {field}")
            if not value.startswith("ca-app-" + data.get("publisherId", "missing") + separator):
                raise BuildError("Registered advertising publisher mismatch")
            result[variable] = value
    return result


def signing_env(env):
    preflight = Path.home() / ".codex/skills/seorilabs-credentials/scripts/preflight.sh"
    run([str(preflight), "app/paper-craft-print/google-play/upload-key"], env=env)
    companion, key = KEY_DIR / "signing.json", KEY_DIR / "upload.p12"
    if not companion.is_file() or not key.is_file():
        raise BuildError("Registered upload key or companion is missing")
    if companion.stat().st_mode & 0o077 or key.stat().st_mode & 0o077:
        raise BuildError("Upload key and companion must be private files")
    data = json.loads(companion.read_text())
    fields = {"keystorePath": "CRAFT_UPLOAD_KEYSTORE_PATH", "keystoreType": "CRAFT_UPLOAD_KEYSTORE_TYPE",
              "keyAlias": "CRAFT_UPLOAD_KEY_ALIAS", "keystorePassword": "CRAFT_UPLOAD_STORE_PASSWORD",
              "keyPassword": "CRAFT_UPLOAD_KEY_PASSWORD"}
    if any(not isinstance(data.get(field), str) or not data[field] for field in (*fields, "certificateSha256")):
        raise BuildError("Signing companion has incomplete fields")
    if Path(data["keystorePath"]).expanduser().resolve() != key.resolve() or data["keystoreType"].upper() != "PKCS12":
        raise BuildError("Signing companion does not identify the registered PKCS12 upload key")
    fingerprint = re.sub(r"[:\s]", "", data["certificateSha256"]).lower()
    if not re.fullmatch(r"[0-9a-f]{64}", fingerprint):
        raise BuildError("Registered certificate fingerprint is invalid")
    result = env.copy()
    result.update({variable: data[field] for field, variable in fields.items()})
    result["CRAFT_UPLOAD_KEYSTORE_PATH"] = str(key)
    return result, fingerprint, (data["keystorePassword"], data["keyPassword"])


def fingerprint(pem):
    certificates = re.findall(r"-----BEGIN CERTIFICATE-----\s*(.*?)\s*-----END CERTIFICATE-----", pem, re.S)
    if len(certificates) != 1:
        raise BuildError("Expected exactly one upload certificate")
    return hashlib.sha256(base64.b64decode(certificates[0])).hexdigest()


def aab_certificate(path, env):
    # Read the public signing certificate from the verified JAR's PKCS7 block.
    # keytool -printcert -jarfile can consult a missing default user keystore.
    with zipfile.ZipFile(path) as archive:
        blocks = [name for name in archive.namelist()
                  if re.fullmatch(r"META-INF/[^/]+\.(RSA|DSA|EC)", name, re.I)]
        if len(blocks) != 1:
            raise BuildError("Expected one AAB signature block")
        return fingerprint(run(["openssl", "pkcs7", "-inform", "DER", "-print_certs"],
                               env=env, input_bytes=archive.read(blocks[0])))


def apk_certificates(output):
    # Build Tools 37 labels signers by scheme; older versions number them.
    return {digest.lower() for digest in re.findall(
        r"^(?:Signer #\d+|V\d(?:\.\d+)? Signer):? certificate SHA-256 digest: ([0-9a-fA-F]{64})\s*$",
        output, re.M)}


def manifest_identity(text):
    manifest = ET.fromstring(text)
    identity = {"package": manifest.get("package"), "versionName": manifest.get(ANDROID + "versionName"),
                "versionCode": manifest.get(ANDROID + "versionCode")}
    if identity != {"package": PACKAGE, "versionName": VERSION, "versionCode": str(CODE)}:
        raise BuildError("Built release manifest identity mismatch")
    app = manifest.find("application")
    if app is None or app.get(ANDROID + "debuggable", "false") != "false":
        raise BuildError("Built release is debuggable or missing application")
    return identity


def artifact_abis(path, prefix):
    with zipfile.ZipFile(path) as archive:
        found = {name.split("/")[len(prefix.split("/"))] for name in archive.namelist()
                 if name.startswith(prefix + "/") and name.endswith(".so")}
    if found != ABIS:
        raise BuildError(f"Artifact native ABI mismatch: {sorted(found)}")
    return sorted(found)


def build(root, mode, env):
    sha, policy_sha, evidence_digest = gate(root, env)
    env = advertising_env(root, mode, env)
    studio_java = Path("/Applications/Android Studio.app/Contents/jbr/Contents/Home")
    if not env.get("JAVA_HOME") and studio_java.is_dir():
        env["JAVA_HOME"] = str(studio_java)
    if env.get("JAVA_HOME"):
        env["PATH"] = str(Path(env["JAVA_HOME"]) / "bin") + os.pathsep + env.get("PATH", "")
    sdk = Path(env.get("ANDROID_HOME", str(Path.home() / "Library/Android/sdk"))).expanduser()
    candidates = sorted((sdk / "build-tools").glob("[0-9]*"), key=lambda p: tuple(int(x) for x in re.findall(r"\d+", p.name)), reverse=True)
    tools = next((p for p in candidates if (p / "aapt2").is_file() and (p / "apksigner").is_file()), None)
    if not tools:
        raise BuildError("Android build-tools with aapt2 and apksigner are required")
    env.update({"ANDROID_HOME": str(sdk), "CI": "1", "LC_ALL": "C"})
    signed, expected_cert, secrets = signing_env(env)
    key_pem = run(["keytool", "-exportcert", "-rfc", "-keystore", str(KEY_DIR / "upload.p12"),
                   "-storetype", "PKCS12", "-alias", signed["CRAFT_UPLOAD_KEY_ALIAS"],
                   "-storepass:env", "CRAFT_UPLOAD_STORE_PASSWORD"], env=signed, secrets=secrets)
    if fingerprint(key_pem) != expected_cert:
        raise BuildError("Upload certificate does not match the registered identity")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output = root / "artifacts/android" / f"{VERSION}-{sha[:12]}-{mode}-{stamp}-{uuid.uuid4().hex[:8]}"
    output.mkdir(parents=True, exist_ok=False)
    with tempfile.TemporaryDirectory(prefix="paper-craft-android-") as temporary:
        stage = Path(temporary)
        with (stage / "source.tar").open("wb") as archive:
            subprocess.run(["git", "archive", "--format=tar", sha], cwd=root, stdout=archive, check=True)
        source = stage / "source"
        source.mkdir()
        with tarfile.open(stage / "source.tar") as archive:
            archive.extractall(source, filter="data")
        run(["npm", "ci", "--no-audit", "--no-fund"], cwd=source, env=env, log=output / "dependencies.log")
        mobile = source / "apps/mobile"
        config = json.loads(run(["npx", "--no-install", "expo", "config", "--json"], cwd=mobile, env=env))
        android = config.get("android", {})
        if config.get("version") != VERSION or android.get("package") != PACKAGE or android.get("versionCode") != CODE:
            raise BuildError("Expo configuration does not match approved 1.0.0 (1)")
        run(["npx", "--no-install", "expo", "prebuild", "--platform", "android", "--no-install"],
            cwd=mobile, env=env, log=output / "prebuild.log")
        init = stage / "signing.gradle"
        init.write_text(SIGNING_INIT)
        native = mobile / "android"
        print(f"Building {VERSION} ({CODE}), {mode} ads, three native ABIs", flush=True)
        run(["./gradlew", ":app:bundleRelease", ":app:assembleRelease", "-I", str(init),
             "-PreactNativeArchitectures=" + ",".join(sorted(ABIS)), "--no-daemon", "--no-configuration-cache",
             "--no-build-cache", "--console=plain"], cwd=native, env=signed, log=output / "gradle.log", secrets=secrets)
        # Preserve completed builds even if a later static verification fails.
        # Only build-report.json marks an artifact as an accepted candidate.
        aab = output / f"paper-craft-print-{VERSION}-{CODE}-{mode}-ads.aab"
        apk = output / f"paper-craft-print-{VERSION}-{CODE}-{mode}-ads.apk"
        shutil.copyfile(native / "app/build/outputs/bundle/release/app-release.aab", aab)
        shutil.copyfile(native / "app/build/outputs/apk/release/app-release.apk", apk)
        signature = run(["jarsigner", "-verify", str(aab)], env=env, log=output / "aab-signature.txt")
        if "jar verified." not in signature or "unsigned entries" in signature.lower():
            raise BuildError("AAB JAR signature was not verified")
        actual_cert = aab_certificate(aab, env)
        apk_signature = run([str(tools / "apksigner"), "verify", "--print-certs", str(apk)], env=env, log=output / "apk-signature.txt")
        if actual_cert != expected_cert or apk_certificates(apk_signature) != {expected_cert}:
            raise BuildError("AAB or APK is not signed with the registered upload key")
        badging = run([str(tools / "aapt2"), "dump", "badging", str(apk)], env=env, log=output / "apk-manifest.txt")
        package_line = next((line for line in badging.splitlines() if line.startswith("package: ")), "")
        if any(token not in package_line for token in (f"name='{PACKAGE}'", f"versionCode='{CODE}'", f"versionName='{VERSION}'")):
            raise BuildError("Packaged APK identity mismatch")
        manifests = list((native / "app/build/intermediates/merged_manifests/release").rglob("AndroidManifest.xml"))
        if len(manifests) != 1:
            raise BuildError("Expected one merged release manifest")
        identity = manifest_identity(manifests[0].read_text())
        shutil.copyfile(manifests[0], output / "merged-release-manifest.xml")
        direct_aab = "unrun: set BUNDLETOOL_JAR for direct AAB manifest readback"
        if env.get("BUNDLETOOL_JAR"):
            text = run(["java", "-jar", str(Path(env["BUNDLETOOL_JAR"]).expanduser()), "dump", "manifest",
                        "--bundle=" + str(aab), "--module=base"], env=env)
            manifest_identity(text)
            (output / "aab-manifest.xml").write_text(text)
            direct_aab = "pass"
        artifacts = []
        for path, prefix in ((aab, "base/lib"), (apk, "lib")):
            abis = artifact_abis(path, prefix)
            artifacts.append({"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                              "bytes": path.stat().st_size, "abis": abis, "certificateSha256": actual_cert})
        if clean_head(root) != sha:
            raise BuildError("Checkout changed during build; artifacts are not accepted as a candidate")
        report = {"status": "built-and-statically-verified", "revision": sha, "policyRevision": policy_sha,
                  "developmentEvidenceSha256": evidence_digest, "adMode": mode, "identity": identity,
                  "aabManifestReadback": direct_aab, "artifacts": artifacts,
                  "nativeRuntimeQa": "unrun", "upload": "unrun", "publicLive": False}
        (output / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps({"output": str(output), **report}, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ad-mode", choices=("test", "production"), default=os.environ.get("CRAFT_AD_MODE", "test"))
    args = parser.parse_args()
    if args.ad_mode not in ("test", "production"):
        parser.error("CRAFT_AD_MODE must be test or production")
    try:
        build(ROOT, args.ad_mode, os.environ.copy())
    except BuildError as error:
        print(f"Android build stopped: {error}", file=sys.stderr)
        return 1
    except Exception:
        print("Android build stopped by an unexpected error; no release success was recorded", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
