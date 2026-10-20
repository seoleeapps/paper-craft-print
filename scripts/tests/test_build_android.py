"""Boundary checks use synthetic data and never read credentials or start builds."""
import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import subprocess
import unittest
from unittest.mock import patch
import zipfile

SPEC = importlib.util.spec_from_file_location("craft_build", Path(__file__).resolve().parents[1] / "build-android.py")
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class BuildBoundaries(unittest.TestCase):
    def test_apksigner_current_and_legacy_certificate_formats(self):
        digest, other = "a" * 64, "b" * 64
        for line in (f"Signer #1 certificate SHA-256 digest: {digest}",
                     f"V2 Signer: certificate SHA-256 digest: {digest}"):
            self.assertEqual(builder.apk_certificates(line), {digest})
        self.assertEqual(builder.apk_certificates(
            f"V2 Signer: certificate SHA-256 digest: {digest}\n"
            f"V3 Signer: certificate SHA-256 digest: {digest}"), {digest})
        self.assertEqual(builder.apk_certificates(
            f"Signer #1 certificate SHA-256 digest: {digest}\n"
            f"Signer #2 certificate SHA-256 digest: {other}"), {digest, other})
        self.assertEqual(builder.apk_certificates("unrecognized certificate output"), set())

    def test_aab_certificate_reads_pkcs7_without_default_keystore(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                            "-subj", "/CN=Synthetic Build Test", "-keyout", str(root / "key.pem"),
                            "-out", str(root / "cert.pem")], check=True, capture_output=True)
            block = subprocess.run(["openssl", "crl2pkcs7", "-nocrl", "-certfile", str(root / "cert.pem"),
                                    "-outform", "DER"], check=True, capture_output=True).stdout
            der = subprocess.run(["openssl", "x509", "-in", str(root / "cert.pem"), "-outform", "DER"],
                                 check=True, capture_output=True).stdout
            path = root / "synthetic.aab"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("META-INF/UPLOAD.RSA", block)
            self.assertEqual(builder.aab_certificate(path, {}), hashlib.sha256(der).hexdigest())
            with zipfile.ZipFile(path, "a") as archive:
                archive.writestr("META-INF/SECOND.RSA", block)
            with self.assertRaises(builder.BuildError):
                builder.aab_certificate(path, {})

    def test_missing_gate_inputs_stop_before_subprocess(self):
        with patch.object(builder, "run") as command:
            with self.assertRaises(builder.BuildError):
                builder.gate(Path("."), {})
            command.assert_not_called()

    def test_dirty_checkout_is_rejected(self):
        with patch.object(builder, "run", return_value="?? user-work.txt\n"):
            with self.assertRaises(builder.BuildError):
                builder.clean_head(Path("."))

    def test_gate_uses_exact_head_and_before_build(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            verifier = root / "scripts/release/verify-development-evidence.mjs"
            verifier.parent.mkdir(parents=True)
            verifier.write_text("synthetic verifier")
            evidence = root / "evidence.json"
            evidence.write_text('{}')
            env = {"CRAFT_DEVELOPMENT_EVIDENCE": str(evidence), "SEORILABS_POLICY_ROOT": str(root)}
            sha, policy_sha = "a" * 40, "b" * 40
            with patch.object(builder, "clean_head", side_effect=(sha, policy_sha)):
                with patch.object(builder, "run", side_effect=(policy_sha + "\tHEAD\n", "pass")) as command:
                    self.assertEqual(builder.gate(root, env)[:2], (sha, policy_sha))
                    args = command.call_args_list[-1].args[0]
                    self.assertEqual(args[args.index("--sha") + 1], sha)
                    self.assertEqual(args[args.index("--phase") + 1], "before-build")
                    self.assertEqual(args[args.index("--target") + 1], "google-play")
            with patch.object(builder, "clean_head", side_effect=(sha, policy_sha)):
                with patch.object(builder, "run", return_value="c" * 40 + "\tHEAD\n") as command:
                    with self.assertRaises(builder.BuildError):
                        builder.gate(root, env)
                    self.assertEqual(command.call_count, 1)

    def test_test_ads_discard_inherited_production_ids(self):
        inherited = {"ADMOB_APP_ID": "production", "ADMOB_REWARDED_AD_UNIT_ID": "production", "ADMOB_BANNER_AD_UNIT_ID": "production", "CRAFT_UPLOAD_STORE_PASSWORD": "synthetic-password"}
        self.assertEqual(builder.advertising_env(Path("."), "test", inherited), {"CRAFT_AD_MODE": "test"})
        self.assertEqual(inherited["ADMOB_APP_ID"], "production")

    def test_production_requires_registered_units_from_same_publisher(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "release").mkdir()
            data = {"publisherId": "pub-1111111111111111", "androidAppId": "ca-app-pub-1111111111111111~1234567890", "rewardedAdUnitId": "ca-app-pub-1111111111111111/1234567890"}
            path = root / "release/admob.json"
            path.write_text(json.dumps(data))
            with self.assertRaises(builder.BuildError):
                builder.advertising_env(root, "production", {})
            data["bannerAdUnitId"] = "ca-app-pub-1111111111111111/9876543210"
            path.write_text(json.dumps(data))
            self.assertEqual(builder.advertising_env(root, "production", {})["ADMOB_BANNER_AD_UNIT_ID"], data["bannerAdUnitId"])
            data["bannerAdUnitId"] = "ca-app-pub-2222222222222222/9876543210"
            path.write_text(json.dumps(data))
            with self.assertRaises(builder.BuildError):
                builder.advertising_env(root, "production", {})

    def test_wrong_version_or_debug_manifest_is_rejected(self):
        manifest = '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.seoleeapps.papercraftprint" android:versionName="1.0.0" android:versionCode="1"><application android:debuggable="false"/></manifest>'
        self.assertEqual(builder.manifest_identity(manifest)["versionCode"], "1")
        for changed in (manifest.replace('debuggable="false"', 'debuggable="true"'), manifest.replace('versionName="1.0.0"', 'versionName="0.1.0"')):
            with self.assertRaises(builder.BuildError):
                builder.manifest_identity(changed)

    def test_missing_native_abi_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "synthetic.aab"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("base/lib/arm64-v8a/libtest.so", b"synthetic")
            with self.assertRaises(builder.BuildError):
                builder.artifact_abis(path, "base/lib")
            with zipfile.ZipFile(path, "a") as archive:
                for abi in ("armeabi-v7a", "x86_64"):
                    archive.writestr(f"base/lib/{abi}/libtest.so", b"synthetic")
            self.assertEqual(set(builder.artifact_abis(path, "base/lib")), builder.ABIS)

    def test_passwords_are_redacted_before_log_write(self):
        with tempfile.TemporaryDirectory() as temporary:
            log = Path(temporary) / "build.log"
            result = builder.subprocess.CompletedProcess([], 1, stdout=b"failure synthetic-password", stderr=b"synthetic-password")
            with patch.object(builder.subprocess, "run", return_value=result):
                with self.assertRaises(builder.BuildError):
                    builder.run(["gradle"], log=log, secrets=("synthetic-password",))
            self.assertNotIn("synthetic-password", log.read_text())
            self.assertIn("[redacted]", log.read_text())


if __name__ == "__main__":
    unittest.main()
