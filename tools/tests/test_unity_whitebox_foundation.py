import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

REQUIRED_SCHEMA_FILES = [
    ROOT / "protocol" / "schemas" / "actor.humanoid.schema.json",
    ROOT / "protocol" / "schemas" / "ability.locomotion.schema.json",
    ROOT / "protocol" / "schemas" / "interaction.pickup.schema.json",
    ROOT / "protocol" / "schemas" / "interaction.throw.schema.json",
    ROOT / "protocol" / "schemas" / "unity.export.schema.json",
    ROOT / "protocol" / "schemas" / "unity.asset.binding.schema.json",
    ROOT / "protocol" / "schemas" / "unity.generated.object.map.schema.json",
]

REQUIRED_PACKAGE_MANIFESTS = [
    ROOT / "packages" / "locomotion" / "manifest.json",
    ROOT / "packages" / "pickup" / "manifest.json",
    ROOT / "packages" / "throw" / "manifest.json",
]

REQUIRED_UNITY_FILES = [
    ROOT / "unity" / "README.md",
    ROOT / "unity" / "FateUnityImporter" / "Runtime" / "FateRecipeAsset.cs",
    ROOT / "unity" / "FateUnityImporter" / "Runtime" / "FateUnityImporter.Runtime.asmdef",
    ROOT / "unity" / "FateUnityImporter" / "Editor" / "FateUnityImporter.Editor.asmdef",
    ROOT / "unity" / "FateUnityImporter" / "Editor" / "FateRecipeImporter.cs",
    ROOT / "unity" / "FateUnityImporter" / "Authoring" / "FateRecipeAuthoring.cs",
]

REQUIRED_METADATA_KEYS = {
    "style",
    "art_style",
    "semantic_tags",
    "notes",
    "real_world_scale",
    "actor_class",
    "interaction_intent",
    "unit_system",
}


class UnityWhiteboxFoundationTests(unittest.TestCase):
    def test_required_schema_files_exist(self) -> None:
        missing = [str(path.relative_to(ROOT)) for path in REQUIRED_SCHEMA_FILES if not path.exists()]
        self.assertEqual([], missing, f"missing schema files: {missing}")

    def test_required_character_package_manifests_exist(self) -> None:
        missing = [str(path.relative_to(ROOT)) for path in REQUIRED_PACKAGE_MANIFESTS if not path.exists()]
        self.assertEqual([], missing, f"missing package manifests: {missing}")

    def test_unity_host_scaffold_exists(self) -> None:
        missing = [str(path.relative_to(ROOT)) for path in REQUIRED_UNITY_FILES if not path.exists()]
        self.assertEqual([], missing, f"missing unity scaffold files: {missing}")

    def test_ladder_manifest_declares_whitebox_metadata(self) -> None:
        manifest_path = ROOT / "packages" / "ladder" / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        missing = sorted(REQUIRED_METADATA_KEYS.difference(manifest.keys()))
        self.assertEqual([], missing, f"ladder manifest missing whitebox metadata keys: {missing}")

    def test_unity_export_schema_declares_audit_and_generated_outputs(self) -> None:
        schema_path = ROOT / "protocol" / "schemas" / "unity.export.schema.json"
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        required = set(schema.get("required", []))
        self.assertTrue({"recipe", "asset_bindings", "generated_object_map", "audit"}.issubset(required))


if __name__ == "__main__":
    unittest.main()
