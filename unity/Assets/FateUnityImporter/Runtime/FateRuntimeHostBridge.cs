using UnityEngine;

namespace FateUnityImporter.Runtime
{
    public static class FateRuntimeHostBridge
    {
        public static FateRuntimeFeatureFlagsRecord ResolveFeatureFlags(FateRecipeAsset recipe)
        {
            if (recipe == null || recipe.RuntimeFeatureFlags == null)
            {
                return new FateRuntimeFeatureFlagsRecord();
            }

            return new FateRuntimeFeatureFlagsRecord
            {
                NpcAiEnabled = recipe.RuntimeFeatureFlags.NpcAiEnabled,
                RuntimeAiMode = recipe.RuntimeFeatureFlags.RuntimeAiMode,
            };
        }

        public static FateRuntimeEntityRecord CreateEntityRecord(
            string entityId,
            string entityKind,
            string actorClass,
            Vector3 positionMeters,
            params string[] stateTags)
        {
            return new FateRuntimeEntityRecord
            {
                EntityId = entityId,
                EntityKind = entityKind,
                ActorClass = actorClass,
                PositionMeters = positionMeters,
                StateTags = stateTags ?? System.Array.Empty<string>(),
            };
        }

        public static FateRuntimeDialogueTurnRecord CreateDialogueTurnRecord(
            string turnId,
            string npcEntityId,
            string playerEntityId,
            string utterance,
            string tone,
            string intent,
            bool usedLocalLlm,
            params FateRuntimeDialogueOptionRecord[] options)
        {
            return new FateRuntimeDialogueTurnRecord
            {
                TurnId = turnId,
                NpcEntityId = npcEntityId,
                PlayerEntityId = playerEntityId,
                Utterance = utterance,
                Tone = tone,
                Intent = intent,
                UsedLocalLlm = usedLocalLlm,
                Options = options ?? System.Array.Empty<FateRuntimeDialogueOptionRecord>(),
            };
        }
    }
}
