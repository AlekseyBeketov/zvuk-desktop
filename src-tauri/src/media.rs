use serde::{Deserialize, Serialize};
use souvlaki::{MediaControls, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NowPlayingMeta {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub cover_url: Option<String>,
    pub duration_secs: Option<u64>,
    pub position_secs: Option<u64>,
    pub is_playing: bool,
}

static CONTROLS: OnceLock<Mutex<Option<MediaControls>>> = OnceLock::new();
static DISPLAY_NAME: &str = "Zvuk Desktop";
static DBUS_NAME: &str = "zvuk_desktop";

/// Initialise the media-controls session and forward media-key events to the
/// frontend as `media-command` events. Idempotent. On unsupported platforms we
/// log and continue (the rest of the app keeps working).
pub fn init_media_controls(app: AppHandle) {
    if CONTROLS.get().is_some() {
        return;
    }

    let config = PlatformConfig {
        display_name: DISPLAY_NAME,
        dbus_name: DBUS_NAME,
        hwnd: None,
    };

    let mut controls = match MediaControls::new(config) {
        Ok(c) => c,
        Err(e) => {
            log::warn!("Media controls unavailable: {e}");
            return;
        }
    };

    let app2 = app.clone();
    if let Err(e) = controls.attach(move |event: souvlaki::MediaControlEvent| {
        let cmd = match event {
            souvlaki::MediaControlEvent::Play => "play",
            souvlaki::MediaControlEvent::Pause => "pause",
            souvlaki::MediaControlEvent::Toggle => "toggle",
            souvlaki::MediaControlEvent::Next => "next",
            souvlaki::MediaControlEvent::Previous => "prev",
            souvlaki::MediaControlEvent::Stop => "stop",
            souvlaki::MediaControlEvent::SetShuffle(v) => {
                let _ = app2.emit("media-shuffle", v);
                return;
            }
            _ => return,
        };
        let _ = app2.emit("media-command", cmd);
    }) {
        log::warn!("Attach media controls failed: {e}");
        return;
    }

    let _ = CONTROLS.set(Mutex::new(Some(controls)));
}

/// Update the OS "Now Playing" panel. `None` clears the metadata.
pub fn update_now_playing(meta: Option<&NowPlayingMeta>) -> Result<(), String> {
    let Some(storage) = CONTROLS.get() else {
        return Ok(());
    };
    let mut guard = storage.lock().map_err(|_| "media lock poisoned".to_string())?;
    let Some(controls) = guard.as_mut() else {
        return Ok(());
    };

    match meta {
        Some(m) => {
            let md = MediaMetadata {
                title: m.title.as_deref(),
                album: m.album.as_deref(),
                artist: m.artist.as_deref(),
                cover_url: m.cover_url.as_deref(),
                duration: m.duration_secs.map(Duration::from_secs),
            };
            controls.set_metadata(md).map_err(|e| e.to_string())?;
            let playback = if m.is_playing {
                MediaPlayback::Playing {
                    progress: m.position_secs.map(|p| MediaPosition(Duration::from_secs(p))),
                }
            } else {
                MediaPlayback::Paused {
                    progress: m.position_secs.map(|p| MediaPosition(Duration::from_secs(p))),
                }
            };
            controls.set_playback(playback).map_err(|e| e.to_string())?;
        }
        None => {
            controls
                .set_metadata(MediaMetadata {
                    title: None,
                    album: None,
                    artist: None,
                    cover_url: None,
                    duration: None,
                })
                .map_err(|e| e.to_string())?;
            controls
                .set_playback(MediaPlayback::Stopped)
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn set_now_playing(meta: Option<NowPlayingMeta>) -> Result<(), String> {
    update_now_playing(meta.as_ref())
}
