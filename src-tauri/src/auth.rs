use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "ru.zvuk.desktop";

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Credentials {
    pub token: Option<String>,
    pub refresh_token: Option<String>,
}

fn entry(account: &str) -> keyring::Result<Entry> {
    Entry::new(SERVICE, account)
}

pub fn save(creds: &Credentials) -> Result<(), String> {
    if let Some(t) = &creds.token {
        entry("auth-token")
            .map_err(|e| e.to_string())?
            .set_password(t)
            .map_err(|e| e.to_string())?;
    }
    if let Some(r) = &creds.refresh_token {
        entry("refresh-token")
            .map_err(|e| e.to_string())?
            .set_password(r)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn load() -> Result<Credentials, String> {
    let token = entry("auth-token")
        .ok()
        .and_then(|e| e.get_password().ok());
    let refresh = entry("refresh-token")
        .ok()
        .and_then(|e| e.get_password().ok());
    Ok(Credentials {
        token,
        refresh_token: refresh,
    })
}

pub fn clear() -> Result<(), String> {
    for account in ["auth-token", "refresh-token"] {
        if let Ok(e) = entry(account) {
            let _ = e.delete_credential();
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_credentials() -> Result<Credentials, String> {
    load()
}

#[tauri::command]
pub fn save_credentials(token: String, refresh_token: Option<String>) -> Result<(), String> {
    save(&Credentials {
        token: Some(token),
        refresh_token,
    })
}

#[tauri::command]
pub fn clear_credentials() -> Result<(), String> {
    clear()
}
