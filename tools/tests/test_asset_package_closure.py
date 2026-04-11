import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

ASSET_PACKAGE_CASES = [
    ("humanoid_foundation_assets", "fate.assets.humanoid.foundation"),
    ("interaction_prop_assets", "fate.assets.interaction.props"),
    ("ladder_foundation_assets", "fate.assets.ladder.foundation"),
]

PRODUCT_PACKAGE_EXPECTATIONS = {
    "locomotion": {"asset_dependencies": ["fate.assets.humanoid.foundation"]},
    "pickup": {"asset_dependencies": ["fate.assets.interaction.props"]},
    "throw": {"asset_dependencies": ["fate.assets.interaction.props"]},
    "ladder": {"asset_dependencies": ["fate.assets.ladder.foundation"]},
}


class AssetPackageClosureTests(unittest.TestCase):
    def test_asset_packages_exist_with_resource_metadata(self) -> None:
        for package_dir_name, package_id in ASSET_PACKAGE_CASES:
            manifest_path = ROOT / "packages" / package_dir_name / "manifest.json"
            publish_path = ROOT / "packages" / package_dir_name / "publish.json"
            self.assertTrue(manifest_path.exists(), f"missing manifest: {manifest_path.relative_to(ROOT)}")
            self.assertTrue(publish_path.exists(), f"missing publish metadata: {publish_path.relative_to(ROOT)}")

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual("asset", manifest.get("package_kind"))
            self.assertEqual(package_id, manifest.get("id"))
            resources = manifest.get("resources")
            self.assertIsInstance(resources, list)
            self.assertGreater(len(resources), 0)
            for resource in resources:
                self.assertIsInstance(resource, dict)
                for key in ("id", "path", "resource_type", "unity_target_type", "license_source", "slot_hints"):
                    self.assertIn(key, resource)

    def test_character_product_packages_declare_asset_dependencies(self) -> None:
        for package_dir_name, expectation in PRODUCT_PACKAGE_EXPECTATIONS.items():
            manifest_path = ROOT / "packages" / package_dir_name / "manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(expectation["asset_dependencies"], manifest.get("asset_dependencies"))
            default_asset_bindings = manifest.get("default_asset_bindings")
            self.assertIsInstance(default_asset_bindings, list)
            self.assertGreater(len(default_asset_bindings), 0)

    def test_unity_asset_binding_schema_requires_asset_provenance(self) -> None:
        schema = json.loads((ROOT / "protocol" / "schemas" / "unity.asset.binding.schema.json").read_text(encoding="utf-8"))
        required = set(schema.get("required", []))
        self.assertTrue(
            {
                "resource_type",
                "unity_target_type",
                "source_package_id",
                "source_package_version",
                "source_resource_id",
                "binding_kind",
            }.issubset(required)
        )


if __name__ == "__main__":
    unittest.main()
