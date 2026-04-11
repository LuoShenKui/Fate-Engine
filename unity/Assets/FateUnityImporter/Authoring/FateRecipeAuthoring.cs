using FateUnityImporter.Runtime;
using UnityEngine;

namespace FateUnityImporter.Authoring
{
    public sealed class FateRecipeAuthoring : MonoBehaviour
    {
        [SerializeField] private FateRecipeAsset recipeAsset;

        public FateRecipeAsset RecipeAsset => recipeAsset;
    }
}
