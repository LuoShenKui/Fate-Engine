using FateUnityImporter.Runtime;
using UnityEngine;

#if UNITY_ENTITIES
using Unity.Entities;

namespace FateUnityImporter.Authoring
{
    public struct FateRecipeReferenceComponent : IComponentData
    {
        public FixedString128Bytes RecipeId;
        public float WalkSpeedMetersPerSecond;
        public float RunSpeedMetersPerSecond;
        public float JumpHeightMeters;
    }

    public sealed class FateRecipeBaker : Baker<FateRecipeAuthoring>
    {
        public override void Bake(FateRecipeAuthoring authoring)
        {
            var entity = GetEntity(TransformUsageFlags.Dynamic);
            var asset = authoring.RecipeAsset;
            if (asset == null)
            {
                return;
            }

            AddComponent(entity, new FateRecipeReferenceComponent
            {
                RecipeId = asset.RecipeId,
                WalkSpeedMetersPerSecond = asset.CharacterFoundation.WalkSpeedMetersPerSecond,
                RunSpeedMetersPerSecond = asset.CharacterFoundation.RunSpeedMetersPerSecond,
                JumpHeightMeters = asset.CharacterFoundation.JumpHeightMeters,
            });
        }
    }
}
#else
namespace FateUnityImporter.Authoring
{
    public static class FateRecipeBakerBridge
    {
        public const string Status = "UNITY_ENTITIES not installed; baker generation is deferred.";
    }
}
#endif
