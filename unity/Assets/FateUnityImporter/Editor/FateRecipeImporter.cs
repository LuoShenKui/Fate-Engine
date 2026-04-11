using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using FateUnityImporter.Runtime;
using UnityEditor;
using UnityEngine;

namespace FateUnityImporter.Editor
{
    public static class FateRecipeImporter
    {
        private const string DemoImportPath = "Assets/FateDemo/Imports/CharacterFoundationDemo.unity-export.json";
        private const string DemoAssetPath = "Assets/FateDemo/Generated/Resources/CharacterFoundationDemoRecipe.asset";
        private const string DemoBindingsRoot = "Assets/FateDemo/Generated/Bindings";

        public static FateRecipeAsset ImportFromJsonFile(string jsonPath)
        {
            if (!File.Exists(jsonPath))
            {
                throw new FileNotFoundException($"Fate recipe JSON not found: {jsonPath}", jsonPath);
            }

            var json = File.ReadAllText(jsonPath);
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            var recipeElement = root.TryGetProperty("recipe", out var parsedRecipe) ? parsedRecipe : default;
            var recipeId = ReadString(recipeElement, "id", "fate.whitebox.character.foundation");
            var runtimeStack = ReadString(root, "runtime_stack", "dots-ecs");
            var nodes = ReadNodes(recipeElement);
            var bindings = ReadBindings(root);
            var profile = ReadCharacterFoundationProfile(recipeElement);

            var asset = ScriptableObject.CreateInstance<FateRecipeAsset>();
            asset.SetFromImportedData(
                json,
                DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture),
                recipeId,
                recipeId,
                ReadString(root, "host", "unity"),
                runtimeStack,
                Array.Empty<string>(),
                ReadRuntimeFeatureFlags(recipeElement),
                profile,
                ReadWorldBible(root),
                ReadPersonas(root),
                nodes,
                bindings);

            return asset;
        }

        [MenuItem("Fate/Import Recipe JSON...")]
        public static void ImportSelectedJson()
        {
            var path = EditorUtility.OpenFilePanel("Import Fate Recipe JSON", Application.dataPath, "json");
            if (string.IsNullOrWhiteSpace(path))
            {
                return;
            }

            var asset = ImportFromJsonFile(path);
            var targetPath = EditorUtility.SaveFilePanelInProject(
                "Save Fate Recipe Asset",
                $"{asset.RecipeId.Replace('.', '_')}",
                "asset",
                "Choose where to save the generated ScriptableObject asset.");

            if (string.IsNullOrWhiteSpace(targetPath))
            {
                UnityEngine.Object.DestroyImmediate(asset);
                return;
            }

            SaveRecipeAsset(asset, targetPath);
            CreateOrUpdateGeneratedBindingAssets(asset, Path.GetDirectoryName(targetPath)?.Replace("\\", "/") ?? "Assets/FateDemo/Generated/Bindings");
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<FateRecipeAsset>(targetPath);
        }

        [MenuItem("Fate/Import Character Foundation Demo Recipe")]
        public static void ImportCharacterFoundationDemoRecipe()
        {
            if (!File.Exists(DemoImportPath))
            {
                Debug.LogError($"Demo import JSON missing: {DemoImportPath}");
                return;
            }

            var asset = ImportFromJsonFile(DemoImportPath);
            SaveRecipeAsset(asset, DemoAssetPath);
            CreateOrUpdateGeneratedBindingAssets(asset, DemoBindingsRoot);
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<FateRecipeAsset>(DemoAssetPath);
        }

        private static void SaveRecipeAsset(FateRecipeAsset asset, string targetPath)
        {
            EnsureFolderHierarchy(Path.GetDirectoryName(targetPath)?.Replace("\\", "/") ?? "Assets");
            var existing = AssetDatabase.LoadAssetAtPath<FateRecipeAsset>(targetPath);
            if (existing != null)
            {
                EditorUtility.CopySerialized(asset, existing);
                UnityEngine.Object.DestroyImmediate(asset);
                EditorUtility.SetDirty(existing);
            }
            else
            {
                AssetDatabase.CreateAsset(asset, targetPath);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static void CreateOrUpdateGeneratedBindingAssets(FateRecipeAsset recipeAsset, string generatedRoot)
        {
            EnsureFolderHierarchy(generatedRoot);
            foreach (var binding in recipeAsset.AssetBindings)
            {
                var folder = $"{generatedRoot}/{Sanitize(binding.NodeId)}";
                EnsureFolderHierarchy(folder);
                var basePath = $"{folder}/{Sanitize(binding.SlotId)}";
                binding.GeneratedAssetPath = CreateOrUpdateBindingAsset(binding, basePath);
            }

            EditorUtility.SetDirty(recipeAsset);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static string CreateOrUpdateBindingAsset(FateAssetBinding binding, string basePath)
        {
            switch (binding.ResourceType)
            {
                case "mesh":
                case "prefab":
                    return CreateOrUpdatePrefab(binding, $"{basePath}.prefab");
                case "material":
                    return CreateOrUpdateMaterial(binding, $"{basePath}.mat");
                default:
                    return CreateOrUpdatePlaceholder(binding, $"{basePath}.asset");
            }
        }

        private static string CreateOrUpdatePrefab(FateAssetBinding binding, string assetPath)
        {
            var primitiveType = binding.SlotId.Contains("ladder") || binding.NodeId.Contains("ladder") ? PrimitiveType.Cube :
                binding.NodeId.Contains("actor") ? PrimitiveType.Capsule :
                PrimitiveType.Cube;
            var temp = GameObject.CreatePrimitive(primitiveType);
            temp.name = binding.SourceResourceId;
            if (primitiveType == PrimitiveType.Cube && binding.NodeId.Contains("ladder"))
            {
                temp.transform.localScale = new Vector3(0.5f, 3.5f, 1.2f);
            }

            var prefab = PrefabUtility.SaveAsPrefabAsset(temp, assetPath);
            UnityEngine.Object.DestroyImmediate(temp);
            return AssetDatabase.GetAssetPath(prefab);
        }

        private static string CreateOrUpdateMaterial(FateAssetBinding binding, string assetPath)
        {
            var material = AssetDatabase.LoadAssetAtPath<Material>(assetPath);
            if (material == null)
            {
                material = new Material(Shader.Find("Standard"));
                AssetDatabase.CreateAsset(material, assetPath);
            }

            material.name = binding.SourceResourceId;
            EditorUtility.SetDirty(material);
            return assetPath;
        }

        private static string CreateOrUpdatePlaceholder(FateAssetBinding binding, string assetPath)
        {
            var asset = AssetDatabase.LoadAssetAtPath<FatePlaceholderResourceAsset>(assetPath);
            if (asset == null)
            {
                asset = ScriptableObject.CreateInstance<FatePlaceholderResourceAsset>();
                AssetDatabase.CreateAsset(asset, assetPath);
            }

            asset.BindingId = binding.BindingId;
            asset.ResourceType = binding.ResourceType;
            asset.SourcePackageId = binding.SourcePackageId;
            asset.SourceResourceId = binding.SourceResourceId;
            asset.Notes = binding.Notes;
            EditorUtility.SetDirty(asset);
            return assetPath;
        }

        private static FateCharacterFoundationProfile ReadCharacterFoundationProfile(JsonElement recipeElement)
        {
            var fields = recipeElement.TryGetProperty("params", out var paramsElement) &&
                         paramsElement.TryGetProperty("brick_fields", out var brickFields)
                ? brickFields
                : default;

            return new FateCharacterFoundationProfile
            {
                HeightMeters = ReadFieldNumber(fields, "humanoid-actor", "heightMeters", 1.78f),
                CapsuleRadiusMeters = 0.28f,
                CapsuleHeightMeters = ReadFieldNumber(fields, "humanoid-actor", "heightMeters", 1.78f),
                WalkSpeedMetersPerSecond = ReadFieldNumber(fields, "locomotion-ability", "walkSpeedMps", 1.42f),
                RunSpeedMetersPerSecond = ReadFieldNumber(fields, "locomotion-ability", "runSpeedMps", 3.8f),
                JumpHeightMeters = ReadFieldNumber(fields, "locomotion-ability", "jumpHeightMeters", 0.45f),
                LadderClimbSpeedMetersPerSecond = 1.9f,
                PickupReachMeters = ReadFieldNumber(fields, "pickup-interaction", "reachDistanceMeters", 1.25f),
                ThrowImpulseNewtons = ReadFieldNumber(fields, "throw-interaction", "throwSpeedMps", 11.5f) / 0.055f,
                StepLengthMeters = 0.75f,
            };
        }

        private static FateRuntimeFeatureFlagsRecord ReadRuntimeFeatureFlags(JsonElement recipeElement)
        {
            var flags = new FateRuntimeFeatureFlagsRecord();
            if (recipeElement.ValueKind == JsonValueKind.Undefined ||
                !recipeElement.TryGetProperty("params", out var paramsElement))
            {
                return flags;
            }

            if (paramsElement.TryGetProperty("runtime_feature_flags", out var featureFlagsElement) &&
                featureFlagsElement.ValueKind == JsonValueKind.Object &&
                featureFlagsElement.TryGetProperty("npc_ai_enabled", out var npcAiEnabledElement) &&
                (npcAiEnabledElement.ValueKind == JsonValueKind.True || npcAiEnabledElement.ValueKind == JsonValueKind.False))
            {
                flags.NpcAiEnabled = npcAiEnabledElement.GetBoolean();
                flags.RuntimeAiMode = flags.NpcAiEnabled ? FateRuntimeAiMode.Enabled : FateRuntimeAiMode.Disabled;
            }

            return flags;
        }

        private static FateWorldBibleRecord ReadWorldBible(JsonElement root)
        {
            if (!root.TryGetProperty("world_bible", out var worldBibleElement) || worldBibleElement.ValueKind != JsonValueKind.Object)
            {
                return new FateWorldBibleRecord
                {
                    SceneId = "character-foundation-demo",
                    CentralConflict = "trust_vs_survival",
                    PhaseSummary = "intro",
                };
            }

            return new FateWorldBibleRecord
            {
                SceneId = ReadString(worldBibleElement, "scene_id", "character-foundation-demo"),
                CentralConflict = ReadString(worldBibleElement, "central_conflict", "trust_vs_survival"),
                PhaseSummary = ReadString(worldBibleElement, "phase_summary", "intro"),
                WorldRules = ReadStringArray(worldBibleElement, "world_rules"),
                PublicLore = ReadStringArray(worldBibleElement, "public_lore"),
            };
        }

        private static FateNpcPersonaProfileRecord[] ReadPersonas(JsonElement root)
        {
            if (!root.TryGetProperty("personas", out var personasElement) || personasElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<FateNpcPersonaProfileRecord>();
            }

            return personasElement.EnumerateArray().Select((persona) => new FateNpcPersonaProfileRecord
            {
                PersonaId = ReadString(persona, "id", string.Empty),
                DisplayName = ReadString(persona, "display_name", string.Empty),
                Role = ReadString(persona, "role", string.Empty),
                Faction = ReadString(persona, "faction", string.Empty),
                BackgroundSummary = ReadString(persona, "background_summary", string.Empty),
                PersonalityTags = ReadStringArray(persona, "personality_tags"),
                PublicFacts = ReadStringArray(persona, "public_facts"),
                SecretFacts = ReadStringArray(persona, "secret_facts"),
                InitialGoals = ReadStringArray(persona, "initial_goals"),
            }).ToArray();
        }

        private static FateRecipeNodeRecord[] ReadNodes(JsonElement recipeElement)
        {
            if (!recipeElement.TryGetProperty("nodes", out var nodesElement) || nodesElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<FateRecipeNodeRecord>();
            }

            return nodesElement.EnumerateArray().Select((node) => new FateRecipeNodeRecord
            {
                NodeId = ReadString(node, "id", string.Empty),
                NodeType = ReadString(node, "type", string.Empty),
                BrickId = ReadString(node, "brickId", ReadString(node, "type", string.Empty)),
            }).ToArray();
        }

        private static FateAssetBinding[] ReadBindings(JsonElement root)
        {
            if (!root.TryGetProperty("asset_bindings", out var bindingsElement) || bindingsElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<FateAssetBinding>();
            }

            return bindingsElement.EnumerateArray().Select((binding) => new FateAssetBinding
            {
                BindingId = ReadString(binding, "binding_id", string.Empty),
                NodeId = ReadString(binding, "node_id", string.Empty),
                SlotId = ReadString(binding, "slot_id", string.Empty),
                AssetRef = ReadString(binding, "asset_ref", string.Empty),
                ResourceType = ReadString(binding, "resource_type", "prefab"),
                UnityTargetType = ReadString(binding, "unity_target_type", "Object"),
                SourcePackageId = ReadString(binding, "source_package_id", string.Empty),
                SourcePackageVersion = ReadString(binding, "source_package_version", string.Empty),
                SourceResourceId = ReadString(binding, "source_resource_id", string.Empty),
                BindingKind = ReadString(binding, "binding_kind", string.Empty),
                UnityTargetPath = ReadString(binding, "unity_target_path", string.Empty),
                Required = binding.TryGetProperty("required", out var requiredElement) && requiredElement.ValueKind == JsonValueKind.True,
                Notes = ReadString(binding, "notes", string.Empty),
                Issues = binding.TryGetProperty("issues", out var issuesElement) && issuesElement.ValueKind == JsonValueKind.Array
                    ? issuesElement.EnumerateArray().Where((item) => item.ValueKind == JsonValueKind.String).Select((item) => item.GetString() ?? string.Empty).ToArray()
                    : Array.Empty<string>(),
            }).ToArray();
        }

        private static float ReadFieldNumber(JsonElement brickFields, string brickId, string key, float fallback)
        {
            if (brickFields.ValueKind != JsonValueKind.Object || !brickFields.TryGetProperty(brickId, out var fieldList) || fieldList.ValueKind != JsonValueKind.Array)
            {
                return fallback;
            }

            foreach (var field in fieldList.EnumerateArray())
            {
                if (ReadString(field, "key", string.Empty) != key)
                {
                    continue;
                }

                if (field.TryGetProperty("value", out var valueElement) && valueElement.TryGetSingle(out var value))
                {
                    return value;
                }
            }

            return fallback;
        }

        private static string ReadString(JsonElement element, string propertyName, string fallback)
        {
            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String)
            {
                return property.GetString() ?? fallback;
            }
            return fallback;
        }

        private static string[] ReadStringArray(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var arrayElement) || arrayElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return arrayElement
                .EnumerateArray()
                .Where((item) => item.ValueKind == JsonValueKind.String)
                .Select((item) => item.GetString() ?? string.Empty)
                .ToArray();
        }

        private static void EnsureFolderHierarchy(string assetFolder)
        {
            var normalized = assetFolder.Replace("\\", "/");
            if (AssetDatabase.IsValidFolder(normalized))
            {
                return;
            }

            var parts = normalized.Split('/');
            var current = parts[0];
            for (var index = 1; index < parts.Length; index += 1)
            {
                var next = $"{current}/{parts[index]}";
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, parts[index]);
                }
                current = next;
            }
        }

        private static string Sanitize(string value) =>
            string.IsNullOrWhiteSpace(value) ? "unnamed" : value.Replace(".", "_").Replace(":", "_").Replace("/", "_");
    }
}
