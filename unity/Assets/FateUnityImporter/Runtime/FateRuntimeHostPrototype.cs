using System;
using UnityEngine;

namespace FateUnityImporter.Runtime
{
    public enum FateRuntimeAiMode
    {
        Disabled = 0,
        Enabled = 1,
        HybridReserved = 2,
    }

    [Serializable]
    public sealed class FateRuntimeFeatureFlagsRecord
    {
        public bool NpcAiEnabled = true;
        public FateRuntimeAiMode RuntimeAiMode = FateRuntimeAiMode.Enabled;
    }

    [Serializable]
    public sealed class FateRuntimeEntityRecord
    {
        public string EntityId = string.Empty;
        public string EntityKind = string.Empty;
        public string ActorClass = string.Empty;
        public Vector3 PositionMeters = Vector3.zero;
        public string[] StateTags = Array.Empty<string>();
    }

    [Serializable]
    public sealed class FateRuntimeTaskRecord
    {
        public string TaskId = string.Empty;
        public string Title = string.Empty;
        public string State = string.Empty;
    }

    [Serializable]
    public sealed class FateRuntimeFateRecord
    {
        public string EntityId = string.Empty;
        public string TimelineId = string.Empty;
        public string WorldPhase = string.Empty;
        public string BranchState = string.Empty;
        public string[] FateTags = Array.Empty<string>();
        public string[] CausalFlags = Array.Empty<string>();
        public string[] BranchHistory = Array.Empty<string>();
        public string[] ActiveArcIds = Array.Empty<string>();
    }

    [Serializable]
    public sealed class FateRuntimeDialogueOptionRecord
    {
        public string OptionId = string.Empty;
        public string Label = string.Empty;
        public string Intent = string.Empty;
    }

    [Serializable]
    public sealed class FateRuntimeDialogueTurnRecord
    {
        public string TurnId = string.Empty;
        public string NpcEntityId = string.Empty;
        public string PlayerEntityId = string.Empty;
        public string Utterance = string.Empty;
        public string Tone = string.Empty;
        public string Intent = string.Empty;
        public bool UsedLocalLlm = true;
        public FateRuntimeDialogueOptionRecord[] Options = Array.Empty<FateRuntimeDialogueOptionRecord>();
        public string[] FateEffects = Array.Empty<string>();
    }

    [Serializable]
    public sealed class FateRuntimeSnapshotRecord
    {
        public string ProtocolVersion = "1.0";
        public int Tick;
        public int Seed;
        public FateRuntimeFeatureFlagsRecord FeatureFlags = new FateRuntimeFeatureFlagsRecord();
        public FateRuntimeEntityRecord[] Entities = Array.Empty<FateRuntimeEntityRecord>();
        public FateRuntimeTaskRecord[] ActiveTasks = Array.Empty<FateRuntimeTaskRecord>();
        public FateRuntimeFateRecord[] FateRecords = Array.Empty<FateRuntimeFateRecord>();
        public FateRuntimeDialogueTurnRecord[] DialogueTurns = Array.Empty<FateRuntimeDialogueTurnRecord>();
    }

    public sealed class FateRuntimeHostPrototype : MonoBehaviour
    {
        public static FateRuntimeHostPrototype Active { get; private set; }

        [SerializeField] private FateRuntimeFeatureFlagsRecord featureFlags = new FateRuntimeFeatureFlagsRecord();
        [SerializeField] private FateRuntimeSnapshotRecord latestSnapshot = new FateRuntimeSnapshotRecord();
        [SerializeField] private FateRuntimeDialogueTurnRecord[] pendingDialogueTurns = Array.Empty<FateRuntimeDialogueTurnRecord>();

        public FateRuntimeFeatureFlagsRecord FeatureFlags => featureFlags;
        public FateRuntimeSnapshotRecord LatestSnapshot => latestSnapshot;

        private void Awake()
        {
            Active = this;
        }

        private void OnDestroy()
        {
            if (Active == this)
            {
                Active = null;
            }
        }

        public void ConfigureNpcAi(bool enabled)
        {
            featureFlags.NpcAiEnabled = enabled;
            featureFlags.RuntimeAiMode = enabled ? FateRuntimeAiMode.Enabled : FateRuntimeAiMode.Disabled;
        }

        public FateRuntimeSnapshotRecord ExportSnapshot()
        {
            return new FateRuntimeSnapshotRecord
            {
                ProtocolVersion = latestSnapshot.ProtocolVersion,
                Tick = latestSnapshot.Tick,
                Seed = latestSnapshot.Seed,
                FeatureFlags = new FateRuntimeFeatureFlagsRecord
                {
                    NpcAiEnabled = featureFlags.NpcAiEnabled,
                    RuntimeAiMode = featureFlags.RuntimeAiMode,
                },
                Entities = latestSnapshot.Entities ?? Array.Empty<FateRuntimeEntityRecord>(),
                ActiveTasks = latestSnapshot.ActiveTasks ?? Array.Empty<FateRuntimeTaskRecord>(),
                FateRecords = latestSnapshot.FateRecords ?? Array.Empty<FateRuntimeFateRecord>(),
                DialogueTurns = latestSnapshot.DialogueTurns ?? Array.Empty<FateRuntimeDialogueTurnRecord>(),
            };
        }

        public void UpdateSnapshot(FateRuntimeSnapshotRecord snapshot)
        {
            latestSnapshot = snapshot ?? new FateRuntimeSnapshotRecord();
            if (latestSnapshot.FeatureFlags == null)
            {
                latestSnapshot.FeatureFlags = new FateRuntimeFeatureFlagsRecord();
            }
            latestSnapshot.FeatureFlags.NpcAiEnabled = featureFlags.NpcAiEnabled;
            latestSnapshot.FeatureFlags.RuntimeAiMode = featureFlags.RuntimeAiMode;
        }

        public void BeginDialogue(FateRuntimeDialogueTurnRecord turn)
        {
            if (turn == null)
            {
                return;
            }

            var next = new FateRuntimeDialogueTurnRecord[pendingDialogueTurns.Length + 1];
            pendingDialogueTurns.CopyTo(next, 0);
            next[^1] = turn;
            pendingDialogueTurns = next;
        }

        public FateRuntimeDialogueTurnRecord SubmitDialogueChoice(string turnId, string optionId)
        {
            for (var index = 0; index < pendingDialogueTurns.Length; index += 1)
            {
                var turn = pendingDialogueTurns[index];
                if (turn == null || turn.TurnId != turnId)
                {
                    continue;
                }

                turn.Intent = optionId;
                return turn;
            }

            return null;
        }

        public FateRuntimeDialogueTurnRecord[] ConsumeDialogueTurns()
        {
            var turns = pendingDialogueTurns;
            pendingDialogueTurns = Array.Empty<FateRuntimeDialogueTurnRecord>();
            return turns;
        }
    }
}
