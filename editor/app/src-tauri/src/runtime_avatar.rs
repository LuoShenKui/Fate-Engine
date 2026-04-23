use std::{
    collections::BTreeMap,
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use door_core::{
    AvatarBodyModel, AvatarTuningProfile, HeadFitProfile, IdentityParameterProfile,
    PlayerAvatarRecord, PublicPersonaProfile,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeAvatarServiceConfig {
    pub db_path: PathBuf,
    pub audit_log_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvatarTemplateRecord {
    pub template_id: String,
    pub label: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeAvatarCreateRequest {
    pub avatar_id: Option<String>,
    pub player_entity_id: String,
    pub template_id: String,
    pub capture_mode: String,
    pub fit_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeAvatarPresentationRequest {
    pub avatar_id: String,
    pub presentation_mode: String,
}

#[derive(Debug, Clone)]
pub struct RuntimeAvatarServices {
    config: RuntimeAvatarServiceConfig,
}

impl RuntimeAvatarServices {
    pub fn new(config: RuntimeAvatarServiceConfig) -> Result<Self, String> {
        ensure_parent_dir(&config.db_path)?;
        ensure_parent_dir(&config.audit_log_path)?;
        let conn = Connection::open(&config.db_path).map_err(|err| err.to_string())?;
        init_avatar_schema(&conn)?;
        Ok(Self { config })
    }

    pub fn runtime_avatar_templates(&self) -> Vec<AvatarTemplateRecord> {
        vec![
            AvatarTemplateRecord {
                template_id: "jp_highschool".to_string(),
                label: "日本高中生".to_string(),
                description: "偏年轻、轻瘦、校园制服基线。".to_string(),
            },
            AvatarTemplateRecord {
                template_id: "office_worker".to_string(),
                label: "社畜".to_string(),
                description: "通勤装、普通体型、成年气质基线。".to_string(),
            },
            AvatarTemplateRecord {
                template_id: "tall_slim".to_string(),
                label: "高挑".to_string(),
                description: "较高身材、修长比例。".to_string(),
            },
            AvatarTemplateRecord {
                template_id: "solid_build".to_string(),
                label: "壮实".to_string(),
                description: "偏壮体格、肩宽更大。".to_string(),
            },
            AvatarTemplateRecord {
                template_id: "soft_round".to_string(),
                label: "微胖".to_string(),
                description: "体型更圆润的安全模板。".to_string(),
            },
        ]
    }

    pub fn runtime_avatar_create_or_update(
        &self,
        request: RuntimeAvatarCreateRequest,
    ) -> Result<PlayerAvatarRecord, String> {
        let avatar_id = request
            .avatar_id
            .clone()
            .unwrap_or_else(|| format!("avatar-{}", now_ms()));
        let facial_feature_params = BTreeMap::from([
            ("eye_span".to_string(), 0.0),
            ("nose_bridge".to_string(), 0.0),
            ("jaw_width".to_string(), 0.0),
        ]);
        let body_scale = template_body_scale(&request.template_id);

        let identity = IdentityParameterProfile {
            avatar_id: avatar_id.clone(),
            player_entity_id: request.player_entity_id.clone(),
            height_meters: body_scale[1] * 1.72,
            build_index: body_scale[0] - 1.0,
            shoulder_width_meters: 0.43 + (body_scale[0] - 1.0) * 0.08,
            leg_length_ratio: 0.5 + (body_scale[1] - 1.0) * 0.03,
            skin_tone: "neutral_light".to_string(),
            gender_style_tendency: "androgynous".to_string(),
            age_tendency: "young_adult".to_string(),
            facial_feature_params,
        };
        let head_fit = HeadFitProfile {
            avatar_id: avatar_id.clone(),
            capture_mode: request.capture_mode.clone(),
            fit_status: request.fit_status.clone(),
            topology_profile: "standard_humanoid_head".to_string(),
            resemblance_notes: if request.capture_mode == "headset_passthrough" {
                "Passthrough-guided fit to a standard head topology.".to_string()
            } else {
                "Template-based fallback head fit.".to_string()
            },
            texture_profile: "hall_face_neutral".to_string(),
            scan_summary: if request.capture_mode == "headset_passthrough" {
                "Passthrough scan requested; placeholder fit result stored for 1.0 host chain.".to_string()
            } else {
                "Passthrough unavailable; template avatar fallback.".to_string()
            },
        };
        let body_model = AvatarBodyModel {
            avatar_id: avatar_id.clone(),
            template_id: request.template_id.clone(),
            body_archetype: request.template_id.clone(),
            body_scale,
            template_based_avatar: request.capture_mode != "headset_passthrough",
        };
        let tuning = AvatarTuningProfile {
            avatar_id: avatar_id.clone(),
            build_offset: 0.0,
            shoulder_offset: 0.0,
            waist_offset: 0.0,
            hairstyle_id: "hair_short_a".to_string(),
            top_id: "uniform_top_a".to_string(),
            bottom_id: "uniform_bottom_a".to_string(),
            shoes_id: "hall_shoes_a".to_string(),
            eyewear_id: None,
        };
        let public_persona = PublicPersonaProfile {
            avatar_id: avatar_id.clone(),
            presentation_mode: "realistic_3d".to_string(),
            anime_persona_id: format!("{avatar_id}-anime"),
            realistic_persona_id: format!("{avatar_id}-real"),
        };
        let avatar = PlayerAvatarRecord {
            avatar_id: avatar_id.clone(),
            player_entity_id: request.player_entity_id.clone(),
            identity,
            head_fit,
            body_model,
            tuning,
            public_persona,
            equipment: vec![
                "hair_short_a".to_string(),
                "uniform_top_a".to_string(),
                "uniform_bottom_a".to_string(),
                "hall_shoes_a".to_string(),
            ],
        };

        let conn = self.open_connection()?;
        upsert_avatar(&conn, &avatar)?;
        insert_capture_session(&conn, &avatar.avatar_id, &request)?;
        self.append_audit("avatar.create", json!({
            "avatar_id": avatar.avatar_id,
            "player_entity_id": avatar.player_entity_id,
            "template_id": request.template_id,
            "capture_mode": request.capture_mode,
            "fit_status": request.fit_status,
        }))?;
        Ok(avatar)
    }

    pub fn runtime_avatar_list_profiles(&self) -> Result<Vec<PlayerAvatarRecord>, String> {
        let conn = self.open_connection()?;
        load_avatar_profiles(&conn)
    }

    pub fn runtime_avatar_switch_presentation(
        &self,
        request: RuntimeAvatarPresentationRequest,
    ) -> Result<PlayerAvatarRecord, String> {
        let conn = self.open_connection()?;
        conn.execute(
            "update avatar_public_persona set presentation_mode = ?1 where avatar_id = ?2",
            params![request.presentation_mode, request.avatar_id],
        )
        .map_err(|err| err.to_string())?;
        self.append_audit("avatar.presentation_switch", json!({
            "avatar_id": request.avatar_id,
            "presentation_mode": request.presentation_mode,
        }))?;
        load_avatar_profile(&conn, &request.avatar_id)
    }

    fn open_connection(&self) -> Result<Connection, String> {
        let conn = Connection::open(&self.config.db_path).map_err(|err| err.to_string())?;
        init_avatar_schema(&conn)?;
        Ok(conn)
    }

    fn append_audit(&self, event_type: &str, payload: serde_json::Value) -> Result<(), String> {
        let line = json!({
            "timestamp_ms": now_ms(),
            "event_type": event_type,
            "payload": payload,
        });
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.config.audit_log_path)
            .map_err(|err| err.to_string())?;
        writeln!(file, "{line}").map_err(|err| err.to_string())
    }
}

fn template_body_scale(template_id: &str) -> [f32; 3] {
    match template_id {
        "jp_highschool" => [0.94, 0.97, 0.94],
        "office_worker" => [1.0, 1.0, 1.0],
        "tall_slim" => [0.96, 1.08, 0.96],
        "solid_build" => [1.12, 1.02, 1.08],
        "soft_round" => [1.08, 0.99, 1.06],
        _ => [1.0, 1.0, 1.0],
    }
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or_default()
}

fn init_avatar_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        create table if not exists avatar_identity_profile (
            avatar_id text primary key,
            player_entity_id text not null,
            height_meters real not null,
            build_index real not null,
            shoulder_width_meters real not null,
            leg_length_ratio real not null,
            skin_tone text not null,
            gender_style_tendency text not null,
            age_tendency text not null,
            facial_feature_params_json text not null
        );
        create table if not exists avatar_head_fit (
            avatar_id text primary key,
            capture_mode text not null,
            fit_status text not null,
            topology_profile text not null,
            resemblance_notes text not null,
            texture_profile text not null,
            scan_summary text not null
        );
        create table if not exists avatar_body_model (
            avatar_id text primary key,
            template_id text not null,
            body_archetype text not null,
            body_scale_json text not null,
            template_based_avatar integer not null
        );
        create table if not exists avatar_tuning_profile (
            avatar_id text primary key,
            build_offset real not null,
            shoulder_offset real not null,
            waist_offset real not null,
            hairstyle_id text not null,
            top_id text not null,
            bottom_id text not null,
            shoes_id text not null,
            eyewear_id text
        );
        create table if not exists avatar_public_persona (
            avatar_id text primary key,
            presentation_mode text not null,
            anime_persona_id text not null,
            realistic_persona_id text not null
        );
        create table if not exists avatar_asset_binding (
            avatar_id text not null,
            slot_id text not null,
            asset_id text not null,
            primary key (avatar_id, slot_id)
        );
        create table if not exists avatar_capture_session (
            capture_session_id text primary key,
            avatar_id text not null,
            capture_mode text not null,
            fit_status text not null,
            created_at_ms integer not null
        );
        ",
    )
    .map_err(|err| err.to_string())
}

fn upsert_avatar(conn: &Connection, avatar: &PlayerAvatarRecord) -> Result<(), String> {
    conn.execute(
        "insert into avatar_identity_profile (
            avatar_id, player_entity_id, height_meters, build_index, shoulder_width_meters,
            leg_length_ratio, skin_tone, gender_style_tendency, age_tendency, facial_feature_params_json
        ) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        on conflict(avatar_id) do update set
            player_entity_id = excluded.player_entity_id,
            height_meters = excluded.height_meters,
            build_index = excluded.build_index,
            shoulder_width_meters = excluded.shoulder_width_meters,
            leg_length_ratio = excluded.leg_length_ratio,
            skin_tone = excluded.skin_tone,
            gender_style_tendency = excluded.gender_style_tendency,
            age_tendency = excluded.age_tendency,
            facial_feature_params_json = excluded.facial_feature_params_json",
        params![
            avatar.avatar_id,
            avatar.player_entity_id,
            avatar.identity.height_meters,
            avatar.identity.build_index,
            avatar.identity.shoulder_width_meters,
            avatar.identity.leg_length_ratio,
            avatar.identity.skin_tone,
            avatar.identity.gender_style_tendency,
            avatar.identity.age_tendency,
            serde_json::to_string(&avatar.identity.facial_feature_params).map_err(|err| err.to_string())?,
        ],
    ).map_err(|err| err.to_string())?;

    conn.execute(
        "insert into avatar_head_fit (
            avatar_id, capture_mode, fit_status, topology_profile, resemblance_notes, texture_profile, scan_summary
        ) values (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        on conflict(avatar_id) do update set
            capture_mode = excluded.capture_mode,
            fit_status = excluded.fit_status,
            topology_profile = excluded.topology_profile,
            resemblance_notes = excluded.resemblance_notes,
            texture_profile = excluded.texture_profile,
            scan_summary = excluded.scan_summary",
        params![
            avatar.avatar_id,
            avatar.head_fit.capture_mode,
            avatar.head_fit.fit_status,
            avatar.head_fit.topology_profile,
            avatar.head_fit.resemblance_notes,
            avatar.head_fit.texture_profile,
            avatar.head_fit.scan_summary,
        ],
    ).map_err(|err| err.to_string())?;

    conn.execute(
        "insert into avatar_body_model (
            avatar_id, template_id, body_archetype, body_scale_json, template_based_avatar
        ) values (?1, ?2, ?3, ?4, ?5)
        on conflict(avatar_id) do update set
            template_id = excluded.template_id,
            body_archetype = excluded.body_archetype,
            body_scale_json = excluded.body_scale_json,
            template_based_avatar = excluded.template_based_avatar",
        params![
            avatar.avatar_id,
            avatar.body_model.template_id,
            avatar.body_model.body_archetype,
            serde_json::to_string(&avatar.body_model.body_scale).map_err(|err| err.to_string())?,
            if avatar.body_model.template_based_avatar { 1 } else { 0 },
        ],
    ).map_err(|err| err.to_string())?;

    conn.execute(
        "insert into avatar_tuning_profile (
            avatar_id, build_offset, shoulder_offset, waist_offset, hairstyle_id, top_id, bottom_id, shoes_id, eyewear_id
        ) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        on conflict(avatar_id) do update set
            build_offset = excluded.build_offset,
            shoulder_offset = excluded.shoulder_offset,
            waist_offset = excluded.waist_offset,
            hairstyle_id = excluded.hairstyle_id,
            top_id = excluded.top_id,
            bottom_id = excluded.bottom_id,
            shoes_id = excluded.shoes_id,
            eyewear_id = excluded.eyewear_id",
        params![
            avatar.avatar_id,
            avatar.tuning.build_offset,
            avatar.tuning.shoulder_offset,
            avatar.tuning.waist_offset,
            avatar.tuning.hairstyle_id,
            avatar.tuning.top_id,
            avatar.tuning.bottom_id,
            avatar.tuning.shoes_id,
            avatar.tuning.eyewear_id,
        ],
    ).map_err(|err| err.to_string())?;

    conn.execute(
        "insert into avatar_public_persona (
            avatar_id, presentation_mode, anime_persona_id, realistic_persona_id
        ) values (?1, ?2, ?3, ?4)
        on conflict(avatar_id) do update set
            presentation_mode = excluded.presentation_mode,
            anime_persona_id = excluded.anime_persona_id,
            realistic_persona_id = excluded.realistic_persona_id",
        params![
            avatar.avatar_id,
            avatar.public_persona.presentation_mode,
            avatar.public_persona.anime_persona_id,
            avatar.public_persona.realistic_persona_id,
        ],
    ).map_err(|err| err.to_string())?;

    conn.execute("delete from avatar_asset_binding where avatar_id = ?1", params![avatar.avatar_id])
        .map_err(|err| err.to_string())?;
    for asset_id in &avatar.equipment {
        conn.execute(
            "insert into avatar_asset_binding (avatar_id, slot_id, asset_id) values (?1, ?2, ?3)",
            params![avatar.avatar_id, asset_id_to_slot(asset_id), asset_id],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn insert_capture_session(
    conn: &Connection,
    avatar_id: &str,
    request: &RuntimeAvatarCreateRequest,
) -> Result<(), String> {
    conn.execute(
        "insert into avatar_capture_session (
            capture_session_id, avatar_id, capture_mode, fit_status, created_at_ms
        ) values (?1, ?2, ?3, ?4, ?5)",
        params![
            format!("capture-{}", now_ms()),
            avatar_id,
            request.capture_mode,
            request.fit_status,
            now_ms() as i64,
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn load_avatar_profiles(conn: &Connection) -> Result<Vec<PlayerAvatarRecord>, String> {
    let mut stmt = conn
        .prepare("select avatar_id from avatar_identity_profile order by avatar_id asc")
        .map_err(|err| err.to_string())?;
    let ids = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    ids.into_iter()
        .map(|avatar_id| load_avatar_profile(conn, &avatar_id))
        .collect()
}

fn load_avatar_profile(conn: &Connection, avatar_id: &str) -> Result<PlayerAvatarRecord, String> {
    let identity = conn
        .query_row(
            "select player_entity_id, height_meters, build_index, shoulder_width_meters, leg_length_ratio, skin_tone, gender_style_tendency, age_tendency, facial_feature_params_json
             from avatar_identity_profile where avatar_id = ?1",
            params![avatar_id],
            |row| {
                let facial_json: String = row.get(8)?;
                let facial_feature_params: BTreeMap<String, f32> =
                    serde_json::from_str(&facial_json).unwrap_or_default();
                Ok(IdentityParameterProfile {
                    avatar_id: avatar_id.to_string(),
                    player_entity_id: row.get(0)?,
                    height_meters: row.get(1)?,
                    build_index: row.get(2)?,
                    shoulder_width_meters: row.get(3)?,
                    leg_length_ratio: row.get(4)?,
                    skin_tone: row.get(5)?,
                    gender_style_tendency: row.get(6)?,
                    age_tendency: row.get(7)?,
                    facial_feature_params,
                })
            },
        )
        .map_err(|err| err.to_string())?;

    let head_fit = conn
        .query_row(
            "select capture_mode, fit_status, topology_profile, resemblance_notes, texture_profile, scan_summary
             from avatar_head_fit where avatar_id = ?1",
            params![avatar_id],
            |row| {
                Ok(HeadFitProfile {
                    avatar_id: avatar_id.to_string(),
                    capture_mode: row.get(0)?,
                    fit_status: row.get(1)?,
                    topology_profile: row.get(2)?,
                    resemblance_notes: row.get(3)?,
                    texture_profile: row.get(4)?,
                    scan_summary: row.get(5)?,
                })
            },
        )
        .map_err(|err| err.to_string())?;

    let body_model = conn
        .query_row(
            "select template_id, body_archetype, body_scale_json, template_based_avatar
             from avatar_body_model where avatar_id = ?1",
            params![avatar_id],
            |row| {
                let scale_json: String = row.get(2)?;
                let body_scale: [f32; 3] = serde_json::from_str(&scale_json).unwrap_or([1.0, 1.0, 1.0]);
                Ok(AvatarBodyModel {
                    avatar_id: avatar_id.to_string(),
                    template_id: row.get(0)?,
                    body_archetype: row.get(1)?,
                    body_scale,
                    template_based_avatar: row.get::<_, i64>(3)? != 0,
                })
            },
        )
        .map_err(|err| err.to_string())?;

    let tuning = conn
        .query_row(
            "select build_offset, shoulder_offset, waist_offset, hairstyle_id, top_id, bottom_id, shoes_id, eyewear_id
             from avatar_tuning_profile where avatar_id = ?1",
            params![avatar_id],
            |row| {
                Ok(AvatarTuningProfile {
                    avatar_id: avatar_id.to_string(),
                    build_offset: row.get(0)?,
                    shoulder_offset: row.get(1)?,
                    waist_offset: row.get(2)?,
                    hairstyle_id: row.get(3)?,
                    top_id: row.get(4)?,
                    bottom_id: row.get(5)?,
                    shoes_id: row.get(6)?,
                    eyewear_id: row.get(7)?,
                })
            },
        )
        .map_err(|err| err.to_string())?;

    let public_persona = conn
        .query_row(
            "select presentation_mode, anime_persona_id, realistic_persona_id
             from avatar_public_persona where avatar_id = ?1",
            params![avatar_id],
            |row| {
                Ok(PublicPersonaProfile {
                    avatar_id: avatar_id.to_string(),
                    presentation_mode: row.get(0)?,
                    anime_persona_id: row.get(1)?,
                    realistic_persona_id: row.get(2)?,
                })
            },
        )
        .map_err(|err| err.to_string())?;

    let mut stmt = conn
        .prepare("select asset_id from avatar_asset_binding where avatar_id = ?1 order by slot_id asc")
        .map_err(|err| err.to_string())?;
    let equipment = stmt
        .query_map(params![avatar_id], |row| row.get::<_, String>(0))
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;

    Ok(PlayerAvatarRecord {
        avatar_id: avatar_id.to_string(),
        player_entity_id: identity.player_entity_id.clone(),
        identity,
        head_fit,
        body_model,
        tuning,
        public_persona,
        equipment,
    })
}

fn asset_id_to_slot(asset_id: &str) -> &'static str {
    if asset_id.contains("hair") {
        "hair"
    } else if asset_id.contains("top") {
        "top"
    } else if asset_id.contains("bottom") {
        "bottom"
    } else if asset_id.contains("shoes") {
        "shoes"
    } else if asset_id.contains("glass") {
        "eyewear"
    } else {
        "misc"
    }
}

#[cfg(test)]
mod tests {
    use super::{RuntimeAvatarCreateRequest, RuntimeAvatarServiceConfig, RuntimeAvatarServices};

    #[test]
    fn avatar_service_persists_profiles_and_switches_presentation() {
        let root = std::env::temp_dir().join(format!("fate-avatar-{}", std::process::id()));
        let db_path = root.join("avatar.sqlite3");
        let audit_log_path = root.join("avatar-audit.jsonl");
        let service = RuntimeAvatarServices::new(RuntimeAvatarServiceConfig { db_path, audit_log_path }).expect("service init");

        let avatar = service
            .runtime_avatar_create_or_update(RuntimeAvatarCreateRequest {
                avatar_id: None,
                player_entity_id: "player-1".to_string(),
                template_id: "office_worker".to_string(),
                capture_mode: "template_fallback".to_string(),
                fit_status: "template_based_avatar".to_string(),
            })
            .expect("create avatar");
        assert_eq!(avatar.public_persona.presentation_mode, "realistic_3d");

        let switched = service
            .runtime_avatar_switch_presentation(super::RuntimeAvatarPresentationRequest {
                avatar_id: avatar.avatar_id.clone(),
                presentation_mode: "anime_public_persona".to_string(),
            })
            .expect("switch presentation");
        assert_eq!(switched.public_persona.presentation_mode, "anime_public_persona");

        let profiles = service.runtime_avatar_list_profiles().expect("list profiles");
        assert_eq!(profiles.len(), 1);
        assert_eq!(profiles[0].avatar_id, avatar.avatar_id);
    }
}
