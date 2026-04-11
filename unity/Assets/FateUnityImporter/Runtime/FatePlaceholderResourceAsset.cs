using UnityEngine;

namespace FateUnityImporter.Runtime
{
    [CreateAssetMenu(menuName = "Fate/Placeholder Resource", fileName = "fate-placeholder-resource.asset")]
    public sealed class FatePlaceholderResourceAsset : ScriptableObject
    {
        public string BindingId = string.Empty;
        public string ResourceType = string.Empty;
        public string SourcePackageId = string.Empty;
        public string SourceResourceId = string.Empty;
        public string Notes = string.Empty;
    }
}
