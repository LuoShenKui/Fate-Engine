import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class UnityDemoProjectTests(unittest.TestCase):
    def test_unity_project_structure_exists(self) -> None:
        required = [
            ROOT / "unity" / "ProjectSettings" / "ProjectVersion.txt",
            ROOT / "unity" / "Packages" / "manifest.json",
            ROOT / "unity" / "Assets" / "FateDemo" / "Scenes" / "CharacterFoundationDemo.unity",
            ROOT / "unity" / "Assets" / "FateDemo" / "Imports" / "CharacterFoundationDemo.unity-export.json",
            ROOT / "unity" / "Assets" / "FateUnityImporter" / "Editor" / "FateRecipeImporter.cs",
            ROOT / "unity" / "Assets" / "FateDemo" / "DOTS" / "CharacterFoundationDemoBootstrap.cs",
            ROOT / "unity" / "Assets" / "FateDemo" / "DOTS" / "CharacterFoundationDemoSystem.cs",
        ]
        missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
        self.assertEqual([], missing, f"missing unity demo project files: {missing}")

    def test_demo_export_fixture_contains_required_character_foundation_bindings(self) -> None:
        fixture = json.loads(
            (ROOT / "unity" / "Assets" / "FateDemo" / "Imports" / "CharacterFoundationDemo.unity-export.json").read_text(encoding="utf-8")
        )
        bindings = fixture.get("asset_bindings", [])
        self.assertIsInstance(bindings, list)
        required_slots = {
            "mesh.humanoid",
            "anim.controller",
            "anim.locomotion",
            "mesh.primary",
            "socket.hand",
            "fx.throw",
        }
        actual_slots = {binding.get("slot_id") for binding in bindings if isinstance(binding, dict)}
        self.assertTrue(required_slots.issubset(actual_slots))

    def test_unity_packages_manifest_locks_entities(self) -> None:
        manifest = json.loads((ROOT / "unity" / "Packages" / "manifest.json").read_text(encoding="utf-8"))
        dependencies = manifest.get("dependencies", {})
        self.assertEqual("6000.0.0f1", manifest.get("unity"))
        self.assertIn("com.unity.entities", dependencies)


if __name__ == "__main__":
    unittest.main()
