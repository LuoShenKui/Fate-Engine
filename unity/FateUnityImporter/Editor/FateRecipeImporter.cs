using System;
using System.IO;
using FateUnityImporter.Runtime;
using UnityEditor;
using UnityEngine;

namespace FateUnityImporter.Editor
{
    [Serializable]
    internal sealed class FateRecipeJson
    {
        public string version = "0";
        public string export_kind = "unity_whitebox";
        public string host = "unity";
        public string runtime_stack = "dots-ecs";
        public FateRecipePayload recipe = new FateRecipePayload();
        public FateAssetBindingJson[] asset_bindings = Array.Empty<FateAssetBindingJson>();
    }

    [Serializable]
    internal sealed class FateRecipePayload
    {
        public string id = "fate.whitebox.character.foundation";
        public string[] nodes = Array.Empty<string>();
    }

    [Serializable]
    internal sealed class FateAssetBindingJson
    {
        public string binding_id = string.Empty;
        public string node_id = string.Empty;
        public string slot_id = string.Empty;
        public string asset_ref = string.Empty;
        public string resource_type = string.Empty;
        public string unity_target_type = string.Empty;
        public string source_package_id = string.Empty;
        public string source_package_version = string.Empty;
        public string source_resource_id = string.Empty;
        public string binding_kind = string.Empty;
        public string unity_target_path = string.Empty;
        public bool required = true;
        public string notes = string.Empty;
        public string[] issues = Array.Empty<string>();
    }

    public static class FateRecipeImporter
    {
        public static FateRecipeAsset ImportFromJsonFile(string jsonPath)
        {
            if (!File.Exists(jsonPath))
            {
                throw new FileNotFoundException($"Fate recipe JSON not found: {jsonPath}", jsonPath);
            }

            var json = File.ReadAllText(jsonPath);
            var parsed = JsonUtility.FromJson<FateRecipeJson>(json) ?? new FateRecipeJson();

            var asset = ScriptableObject.CreateInstance<FateRecipeAsset>();
            asset.SetFromImportedData(
                json,
                parsed.recipe != null && !string.IsNullOrWhiteSpace(parsed.recipe.id) ? parsed.recipe.id : "fate.whitebox.character.foundation",
                parsed.recipe != null && !string.IsNullOrWhiteSpace(parsed.recipe.id) ? parsed.recipe.id : "Character Foundation",
                parsed.host,
                Array.Empty<string>(),
                new FateCharacterFoundationProfile(),
                ToRuntimeBindings(parsed.asset_bindings));

            return asset;
        }

        private static FateAssetBinding[] ToRuntimeBindings(FateAssetBindingJson[] assetBindings)
        {
            if (assetBindings == null || assetBindings.Length == 0)
            {
                return Array.Empty<FateAssetBinding>();
            }

            var result = new FateAssetBinding[assetBindings.Length];
            for (var index = 0; index < assetBindings.Length; index += 1)
            {
                var source = assetBindings[index] ?? new FateAssetBindingJson();
                result[index] = new FateAssetBinding
                {
                    BindingId = source.binding_id ?? string.Empty,
                    NodeId = source.node_id ?? string.Empty,
                    SlotId = source.slot_id ?? string.Empty,
                    AssetRef = source.asset_ref ?? string.Empty,
                    ResourceType = source.resource_type ?? string.Empty,
                    UnityTargetType = source.unity_target_type ?? string.Empty,
                    SourcePackageId = source.source_package_id ?? string.Empty,
                    SourcePackageVersion = source.source_package_version ?? string.Empty,
                    SourceResourceId = source.source_resource_id ?? string.Empty,
                    BindingKind = source.binding_kind ?? string.Empty,
                    UnityTargetPath = source.unity_target_path ?? string.Empty,
                    Required = source.required,
                    Notes = source.notes ?? string.Empty,
                    Issues = source.issues ?? Array.Empty<string>(),
                };
            }

            return result;
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

            AssetDatabase.CreateAsset(asset, targetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeObject = asset;
        }
    }
}
