using System;
using UnityEngine;

namespace FateUnityImporter.Runtime
{
    [Serializable]
    public sealed class FateCharacterFoundationProfile
    {
        public float HeightMeters = 1.78f;
        public float CapsuleRadiusMeters = 0.28f;
        public float CapsuleHeightMeters = 1.8f;
        public float WalkSpeedMetersPerSecond = 1.4f;
        public float RunSpeedMetersPerSecond = 4.0f;
        public float JumpHeightMeters = 1.2f;
        public float LadderClimbSpeedMetersPerSecond = 1.9f;
        public float PickupReachMeters = 1.3f;
        public float ThrowImpulseNewtons = 210.0f;
        public float StepLengthMeters = 0.75f;
    }

    [Serializable]
    public sealed class FateRecipeNodeRecord
    {
        public string NodeId = string.Empty;
        public string NodeType = string.Empty;
        public string BrickId = string.Empty;
    }

    [Serializable]
    public sealed class FateAssetBinding
    {
        public string BindingId = string.Empty;
        public string NodeId = string.Empty;
        public string SlotId = string.Empty;
        public string AssetRef = string.Empty;
        public string ResourceType = string.Empty;
        public string UnityTargetType = string.Empty;
        public string SourcePackageId = string.Empty;
        public string SourcePackageVersion = string.Empty;
        public string SourceResourceId = string.Empty;
        public string BindingKind = string.Empty;
        public string UnityTargetPath = string.Empty;
        public string GeneratedAssetPath = string.Empty;
        public bool Required = true;
        public string Notes = string.Empty;
        public string[] Issues = Array.Empty<string>();
    }

    [Serializable]
    public sealed class FateNpcPersonaProfileRecord
    {
        public string PersonaId = string.Empty;
        public string DisplayName = string.Empty;
        public string Role = string.Empty;
        public string Faction = string.Empty;
        public string BackgroundSummary = string.Empty;
        public string[] PersonalityTags = Array.Empty<string>();
        public string[] PublicFacts = Array.Empty<string>();
        public string[] SecretFacts = Array.Empty<string>();
        public string[] InitialGoals = Array.Empty<string>();
    }

    [Serializable]
    public sealed class FateWorldBibleRecord
    {
        public string SceneId = string.Empty;
        public string CentralConflict = string.Empty;
        public string PhaseSummary = string.Empty;
        public string[] WorldRules = Array.Empty<string>();
        public string[] PublicLore = Array.Empty<string>();
    }

    [CreateAssetMenu(menuName = "Fate/Recipe Asset", fileName = "fate-recipe.asset")]
    public sealed class FateRecipeAsset : ScriptableObject
    {
        [TextArea(12, 24)]
        [SerializeField] private string sourceJson = "{}";
        [SerializeField] private string importedAtUtc = string.Empty;
        [SerializeField] private string recipeId = "fate.whitebox.character.foundation";
        [SerializeField] private string displayName = "Character Foundation";
        [SerializeField] private string host = "unity";
        [SerializeField] private string runtimeStack = "dots-ecs";
        [SerializeField] private string[] semanticTags = Array.Empty<string>();
        [SerializeField] private FateRuntimeFeatureFlagsRecord runtimeFeatureFlags = new FateRuntimeFeatureFlagsRecord();
        [SerializeField] private FateCharacterFoundationProfile characterFoundation = new FateCharacterFoundationProfile();
        [SerializeField] private FateWorldBibleRecord worldBible = new FateWorldBibleRecord();
        [SerializeField] private FateNpcPersonaProfileRecord[] personas = Array.Empty<FateNpcPersonaProfileRecord>();
        [SerializeField] private FateRecipeNodeRecord[] nodes = Array.Empty<FateRecipeNodeRecord>();
        [SerializeField] private FateAssetBinding[] assetBindings = Array.Empty<FateAssetBinding>();

        public string SourceJson => sourceJson;
        public string ImportedAtUtc => importedAtUtc;
        public string RecipeId => recipeId;
        public string DisplayName => displayName;
        public string Host => host;
        public string RuntimeStack => runtimeStack;
        public string[] SemanticTags => semanticTags;
        public FateRuntimeFeatureFlagsRecord RuntimeFeatureFlags => runtimeFeatureFlags;
        public FateCharacterFoundationProfile CharacterFoundation => characterFoundation;
        public FateWorldBibleRecord WorldBible => worldBible;
        public FateNpcPersonaProfileRecord[] Personas => personas;
        public FateRecipeNodeRecord[] Nodes => nodes;
        public FateAssetBinding[] AssetBindings => assetBindings;

        public void SetFromImportedData(
            string rawJson,
            string nextImportedAtUtc,
            string nextRecipeId,
            string nextDisplayName,
            string nextHost,
            string nextRuntimeStack,
            string[] nextSemanticTags,
            FateRuntimeFeatureFlagsRecord nextRuntimeFeatureFlags,
            FateCharacterFoundationProfile nextCharacterFoundation,
            FateWorldBibleRecord nextWorldBible,
            FateNpcPersonaProfileRecord[] nextPersonas,
            FateRecipeNodeRecord[] nextNodes,
            FateAssetBinding[] nextAssetBindings)
        {
            sourceJson = rawJson;
            importedAtUtc = nextImportedAtUtc;
            recipeId = nextRecipeId;
            displayName = nextDisplayName;
            host = nextHost;
            runtimeStack = nextRuntimeStack;
            semanticTags = nextSemanticTags ?? Array.Empty<string>();
            runtimeFeatureFlags = nextRuntimeFeatureFlags ?? new FateRuntimeFeatureFlagsRecord();
            characterFoundation = nextCharacterFoundation ?? new FateCharacterFoundationProfile();
            worldBible = nextWorldBible ?? new FateWorldBibleRecord();
            personas = nextPersonas ?? Array.Empty<FateNpcPersonaProfileRecord>();
            nodes = nextNodes ?? Array.Empty<FateRecipeNodeRecord>();
            assetBindings = nextAssetBindings ?? Array.Empty<FateAssetBinding>();
        }
    }
}
