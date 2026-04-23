using System;
using UnityEngine;

namespace FateUnityImporter.Runtime
{
    public enum XrLocomotionMode
    {
        Teleport = 0,
        Smooth = 1,
    }

    public enum XrInteractionKind
    {
        None = 0,
        RaySelect = 1,
        RayActivate = 2,
        UiSubmit = 3,
        Grab = 4,
    }

    [Serializable]
    public sealed class XrPlayerRigStateRecord
    {
        public Vector3 PlayerRootPosition = Vector3.zero;
        public Quaternion PlayerRootRotation = Quaternion.identity;
        public Vector3 HeadPosition = Vector3.zero;
        public Quaternion HeadRotation = Quaternion.identity;
        public XrLocomotionMode LocomotionMode = XrLocomotionMode.Teleport;
    }

    [Serializable]
    public sealed class XrHandStateRecord
    {
        public string Handedness = "left";
        public Vector3 Position = Vector3.zero;
        public Quaternion Rotation = Quaternion.identity;
        public bool IsTracked = true;
        public bool IsSelecting;
        public bool IsActivating;
    }

    [Serializable]
    public sealed class XrInteractionCommandRecord
    {
        public string InteractionId = string.Empty;
        public XrInteractionKind InteractionKind = XrInteractionKind.None;
        public string TargetId = string.Empty;
        public string Handedness = string.Empty;
        public string Payload = string.Empty;
    }

    [Serializable]
    public sealed class XrRoomAnchorRecord
    {
        public string AnchorId = string.Empty;
        public string AnchorKind = string.Empty;
        public Vector3 Position = Vector3.zero;
        public Quaternion Rotation = Quaternion.identity;
        public Vector3 SizeMeters = Vector3.one;
    }

    [Serializable]
    public sealed class XrHallFeatureModuleRecord
    {
        public string ModuleId = string.Empty;
        public string ModuleKind = string.Empty;
        public string Label = string.Empty;
        public string State = string.Empty;
        public string AnchorId = string.Empty;
        public string[] Capabilities = Array.Empty<string>();
    }

    [Serializable]
    public sealed class XrHallDecorationRecord
    {
        public string DecorationId = string.Empty;
        public string Category = string.Empty;
        public string AnchorId = string.Empty;
        public Vector3 Position = Vector3.zero;
        public Vector3 Scale = Vector3.one;
        public string[] StyleTags = Array.Empty<string>();
    }

    [Serializable]
    public sealed class XrSixthSenseSignalRecord
    {
        public string SignalId = string.Empty;
        public string RecipientEntityId = string.Empty;
        public string Kind = string.Empty;
        public string Summary = string.Empty;
        public Vector3 SuggestedPosition = Vector3.zero;
        public bool HasSuggestedPosition;
        public float Confidence = 0.5f;
    }

    [Serializable]
    public sealed class FateRuntimeXrStateRecord
    {
        public XrPlayerRigStateRecord PlayerRig = new XrPlayerRigStateRecord();
        public XrHandStateRecord LeftHand = new XrHandStateRecord { Handedness = "left" };
        public XrHandStateRecord RightHand = new XrHandStateRecord { Handedness = "right" };
        public XrRoomAnchorRecord[] RoomAnchors = Array.Empty<XrRoomAnchorRecord>();
        public XrHallFeatureModuleRecord[] HallModules = Array.Empty<XrHallFeatureModuleRecord>();
        public XrHallDecorationRecord[] Decorations = Array.Empty<XrHallDecorationRecord>();
        public XrSixthSenseSignalRecord[] SixthSenseSignals = Array.Empty<XrSixthSenseSignalRecord>();
    }
}
