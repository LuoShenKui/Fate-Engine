using FateUnityImporter.Runtime;
using UnityEngine;

namespace FateDemo.XR
{
    public sealed class FateXrHostLayer : MonoBehaviour
    {
        [SerializeField] private Transform playerRoot;
        [SerializeField] private Transform headAnchor;
        [SerializeField] private Transform leftHandAnchor;
        [SerializeField] private Transform rightHandAnchor;
        [SerializeField] private XrLocomotionMode locomotionMode = XrLocomotionMode.Teleport;

        private FateRuntimeHostPrototype runtimeHost;
        private XrRoomAnchorRecord[] roomAnchors = System.Array.Empty<XrRoomAnchorRecord>();
        private XrHallFeatureModuleRecord[] hallModules = System.Array.Empty<XrHallFeatureModuleRecord>();
        private XrHallDecorationRecord[] decorations = System.Array.Empty<XrHallDecorationRecord>();
        private XrSixthSenseSignalRecord[] sixthSenseSignals = System.Array.Empty<XrSixthSenseSignalRecord>();

        public XrLocomotionMode LocomotionMode => locomotionMode;

        public void Initialize(
            FateRuntimeHostPrototype host,
            Transform playerRootTransform,
            Transform headTransform,
            Transform leftHandTransform,
            Transform rightHandTransform,
            XrRoomAnchorRecord[] anchors)
        {
            runtimeHost = host;
            playerRoot = playerRootTransform;
            headAnchor = headTransform;
            leftHandAnchor = leftHandTransform;
            rightHandAnchor = rightHandTransform;
            roomAnchors = anchors ?? System.Array.Empty<XrRoomAnchorRecord>();
            PushRigState(false, false, false, false);
        }

        public void ConfigureHall(
            XrHallFeatureModuleRecord[] modules,
            XrHallDecorationRecord[] hallDecorations,
            XrSixthSenseSignalRecord[] signals)
        {
            hallModules = modules ?? System.Array.Empty<XrHallFeatureModuleRecord>();
            decorations = hallDecorations ?? System.Array.Empty<XrHallDecorationRecord>();
            sixthSenseSignals = signals ?? System.Array.Empty<XrSixthSenseSignalRecord>();
            PushRigState(false, false, false, false);
        }

        public void SetLocomotionMode(XrLocomotionMode mode)
        {
            locomotionMode = mode;
            PushRigState(false, false, false, false);
        }

        public void PushRigState(bool leftSelecting, bool leftActivating, bool rightSelecting, bool rightActivating)
        {
            if (runtimeHost == null || playerRoot == null || headAnchor == null || leftHandAnchor == null || rightHandAnchor == null)
            {
                return;
            }

            runtimeHost.UpdateXrState(new FateRuntimeXrStateRecord
            {
                PlayerRig = new XrPlayerRigStateRecord
                {
                    PlayerRootPosition = playerRoot.position,
                    PlayerRootRotation = playerRoot.rotation,
                    HeadPosition = headAnchor.position,
                    HeadRotation = headAnchor.rotation,
                    LocomotionMode = locomotionMode,
                },
                LeftHand = new XrHandStateRecord
                {
                    Handedness = "left",
                    Position = leftHandAnchor.position,
                    Rotation = leftHandAnchor.rotation,
                    IsTracked = true,
                    IsSelecting = leftSelecting,
                    IsActivating = leftActivating,
                },
                RightHand = new XrHandStateRecord
                {
                    Handedness = "right",
                    Position = rightHandAnchor.position,
                    Rotation = rightHandAnchor.rotation,
                    IsTracked = true,
                    IsSelecting = rightSelecting,
                    IsActivating = rightActivating,
                },
                RoomAnchors = roomAnchors,
                HallModules = hallModules,
                Decorations = decorations,
                SixthSenseSignals = sixthSenseSignals,
            });
        }

        public void SubmitInteraction(string interactionId, XrInteractionKind interactionKind, string targetId, string handedness, string payload = "")
        {
            runtimeHost?.SubmitXrInteraction(new XrInteractionCommandRecord
            {
                InteractionId = interactionId,
                InteractionKind = interactionKind,
                TargetId = targetId,
                Handedness = handedness,
                Payload = payload ?? string.Empty,
            });
        }
    }
}
