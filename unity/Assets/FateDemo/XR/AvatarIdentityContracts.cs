using System;
using UnityEngine;

namespace FateDemo.XR
{
    [Serializable]
    public sealed class IdentityParameterProfile
    {
        public string AvatarId = "player-default";
        public string PlayerEntityId = "xr-player-rig";
        public float HeightMeters = 1.72f;
        public float BuildIndex = 0f;
        public float ShoulderWidthMeters = 0.43f;
        public float LegLengthRatio = 0.5f;
        public string SkinTone = "neutral_light";
        public string GenderStyleTendency = "androgynous";
        public string AgeTendency = "young_adult";
        public string FacialFeatureSummary = "standard_baseline";
    }

    [Serializable]
    public sealed class HeadFitProfile
    {
        public string AvatarId = "player-default";
        public string CaptureMode = "headset_passthrough_reserved";
        public string FitStatus = "pending";
        public string TopologyProfile = "standard_humanoid_head";
        public string ResemblanceNotes = "1.0 keeps likeness on a standard topology.";
        public string TextureProfile = "hall_face_neutral";
        public string ScanSummary = "Headset passthrough capture is the primary fit path. Template fallback remains available.";
    }

    [Serializable]
    public sealed class AvatarBodyModel
    {
        public string AvatarId = "player-default";
        public string TemplateId = "office_worker";
        public string BaseArchetype = "realistic-grounded";
        public Vector3 BodyScale = Vector3.one;
        public bool TemplateBasedAvatar;
        public string MeshSlot = "avatar_body_base";
    }

    [Serializable]
    public sealed class AvatarTuningProfile
    {
        [Range(-0.15f, 0.15f)] public float BuildOffset = 0f;
        [Range(-0.1f, 0.1f)] public float ShoulderOffset = 0f;
        [Range(-0.1f, 0.1f)] public float WaistOffset = 0f;
        public string HairstyleId = "hair_short_a";
        public string OutfitId = "hall_suit_a";
        public string PublicSkinId = "realistic-default";
    }

    [Serializable]
    public sealed class PublicPersonaProfile
    {
        public string AvatarId = "player-default";
        public string PresentationMode = "realistic_3d";
        public string AlternateAnimeProfileId = "reserved-anime-profile";
        public string AlternateThreeDimensionalProfileId = "reserved-alt-3d-profile";
    }

    [Serializable]
    public sealed class PlayerAvatarRecord
    {
        public IdentityParameterProfile Identity = new IdentityParameterProfile();
        public HeadFitProfile HeadFit = new HeadFitProfile();
        public AvatarBodyModel BodyModel = new AvatarBodyModel();
        public AvatarTuningProfile Tuning = new AvatarTuningProfile();
        public PublicPersonaProfile PublicPersona = new PublicPersonaProfile();
    }
}
