use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IdentityParameterProfile {
    pub avatar_id: String,
    pub player_entity_id: String,
    pub height_meters: f32,
    pub build_index: f32,
    pub shoulder_width_meters: f32,
    pub leg_length_ratio: f32,
    pub skin_tone: String,
    pub gender_style_tendency: String,
    pub age_tendency: String,
    pub facial_feature_params: BTreeMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HeadFitProfile {
    pub avatar_id: String,
    pub capture_mode: String,
    pub fit_status: String,
    pub topology_profile: String,
    pub resemblance_notes: String,
    pub texture_profile: String,
    pub scan_summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AvatarBodyModel {
    pub avatar_id: String,
    pub template_id: String,
    pub body_archetype: String,
    pub body_scale: [f32; 3],
    pub template_based_avatar: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AvatarTuningProfile {
    pub avatar_id: String,
    pub build_offset: f32,
    pub shoulder_offset: f32,
    pub waist_offset: f32,
    pub hairstyle_id: String,
    pub top_id: String,
    pub bottom_id: String,
    pub shoes_id: String,
    pub eyewear_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PublicPersonaProfile {
    pub avatar_id: String,
    pub presentation_mode: String,
    pub anime_persona_id: String,
    pub realistic_persona_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PlayerAvatarRecord {
    pub avatar_id: String,
    pub player_entity_id: String,
    pub identity: IdentityParameterProfile,
    pub head_fit: HeadFitProfile,
    pub body_model: AvatarBodyModel,
    pub tuning: AvatarTuningProfile,
    pub public_persona: PublicPersonaProfile,
    pub equipment: Vec<String>,
}
