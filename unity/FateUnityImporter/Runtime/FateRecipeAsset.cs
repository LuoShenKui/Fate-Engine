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
        public bool Required = true;
        public string Notes = string.Empty;
        public string[] Issues = Array.Empty<string>();
    }

    [CreateAssetMenu(menuName = "Fate/Recipe Asset", fileName = "fate-recipe.asset")]
    public sealed class FateRecipeAsset : ScriptableObject
    {
        [TextArea(12, 24)]
        [SerializeField] private string sourceJson = "{}";

        [SerializeField] private string recipeId = "fate.whitebox.character.foundation";
        [SerializeField] private string displayName = "Character Foundation";
        [SerializeField] private string host = "Unity";
        [SerializeField] private string[] semanticTags = Array.Empty<string>();
        [SerializeField] private FateCharacterFoundationProfile characterFoundation = new FateCharacterFoundationProfile();
        [SerializeField] private FateAssetBinding[] assetBindings = Array.Empty<FateAssetBinding>();

        public string SourceJson => sourceJson;
        public string RecipeId => recipeId;
        public string DisplayName => displayName;
        public string Host => host;
        public string[] SemanticTags => semanticTags;
        public FateCharacterFoundationProfile CharacterFoundation => characterFoundation;
        public FateAssetBinding[] AssetBindings => assetBindings;

        public void SetFromImportedData(
            string rawJson,
            string nextRecipeId,
            string nextDisplayName,
            string nextHost,
            string[] nextSemanticTags,
            FateCharacterFoundationProfile nextCharacterFoundation,
            FateAssetBinding[] nextAssetBindings)
        {
            sourceJson = rawJson;
            recipeId = nextRecipeId;
            displayName = nextDisplayName;
            host = nextHost;
            semanticTags = nextSemanticTags ?? Array.Empty<string>();
            characterFoundation = nextCharacterFoundation ?? new FateCharacterFoundationProfile();
            assetBindings = nextAssetBindings ?? Array.Empty<FateAssetBinding>();
        }
    }
}
