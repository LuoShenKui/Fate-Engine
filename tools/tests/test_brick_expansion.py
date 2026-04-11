from __future__ import annotations

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
PACKAGES_DIR = ROOT / "packages"


class BrickExpansionTests(unittest.TestCase):
    def test_product_and_logic_package_count_reaches_first_wave_target(self) -> None:
        manifests = [json.loads(path.read_text(encoding="utf-8")) for path in PACKAGES_DIR.glob("*/manifest.json")]
        product_or_logic = [manifest for manifest in manifests if manifest.get("package_kind") in {"product", "logic"}]
        self.assertGreaterEqual(len(product_or_logic), 24)
        self.assertLessEqual(len(product_or_logic), 36)

    def test_realistic_asset_package_count_reaches_first_wave_target(self) -> None:
        manifests = [json.loads(path.read_text(encoding="utf-8")) for path in PACKAGES_DIR.glob("*/manifest.json")]
        assets = [manifest for manifest in manifests if manifest.get("package_kind") == "asset"]
        self.assertGreaterEqual(len(assets), 8)

    def test_key_grounded_packages_exist(self) -> None:
        expected_ids = {
            "fate.interaction.button",
            "fate.interaction.locked-door",
            "fate.interaction.key-pickup",
            "fate.interaction.chest",
            "fate.enemy.patrol",
            "fate.enemy.melee-attack",
            "fate.enemy.ranged-attack",
            "fate.enemy.spawner",
            "fate.enemy.aggro-sensor",
            "fate.loot.pickup-reward",
            "fate.assets.doors.locks",
            "fate.assets.loot.chests",
        }
        manifests = [json.loads(path.read_text(encoding="utf-8")) for path in PACKAGES_DIR.glob("*/manifest.json")]
        ids = {manifest.get("id") for manifest in manifests}
        self.assertTrue(expected_ids.issubset(ids))


if __name__ == "__main__":
    unittest.main()
