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

        public static XrRoomAnchorRecord CreateRoomAnchorRecord(
            string anchorId,
            string anchorKind,
            Vector3 position,
            Quaternion rotation,
            Vector3 sizeMeters)
        {
            return new XrRoomAnchorRecord
            {
                AnchorId = anchorId,
                AnchorKind = anchorKind,
                Position = position,
                Rotation = rotation,
                SizeMeters = sizeMeters,
            };
        }

        public static FateRuntimeXrStateRecord CreateXrStateRecord(
            Vector3 playerRootPosition,
            Quaternion playerRootRotation,
            Vector3 headPosition,
            Quaternion headRotation,
            Vector3 leftHandPosition,
            Quaternion leftHandRotation,
            Vector3 rightHandPosition,
            Quaternion rightHandRotation,
            XrLocomotionMode locomotionMode,
            XrRoomAnchorRecord[] roomAnchors)
        {
            return new FateRuntimeXrStateRecord
            {
                PlayerRig = new XrPlayerRigStateRecord
                {
                    PlayerRootPosition = playerRootPosition,
                    PlayerRootRotation = playerRootRotation,
                    HeadPosition = headPosition,
                    HeadRotation = headRotation,
                    LocomotionMode = locomotionMode,
                },
                LeftHand = new XrHandStateRecord
                {
                    Handedness = "left",
                    Position = leftHandPosition,
                    Rotation = leftHandRotation,
                    IsTracked = true,
                },
                RightHand = new XrHandStateRecord
                {
                    Handedness = "right",
                    Position = rightHandPosition,
                    Rotation = rightHandRotation,
                    IsTracked = true,
                },
                RoomAnchors = roomAnchors ?? System.Array.Empty<XrRoomAnchorRecord>(),
            };
        }
    }
}
