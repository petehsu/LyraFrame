//! File system operations command handlers
//! 
//! This module provides Tauri commands for file system operations,
//! replacing the browser's File System Access API.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::command;

/// Represents a file or directory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub children: Option<Vec<FileEntry>>,
}

/// Read directory contents (non-recursive)
#[command]
pub async fn read_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&path);
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    let read_result = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in read_result {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: if metadata.is_file() {
                Some(metadata.len())
            } else {
                None
            },
            children: None,
        });
    }

    // Sort: directories first, then files, both alphabetically
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

/// Read binary file contents
#[command]
pub async fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

/// Read text file contents (UTF-8)
#[command]
pub async fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read text file '{}': {}", path, e))
}

/// Write binary data to file
#[command]
pub async fn write_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::write(&path, contents).map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

/// Write text content to file (UTF-8)
#[command]
pub async fn write_text_file(path: String, contents: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::write(&path, contents).map_err(|e| format!("Failed to write text file '{}': {}", path, e))
}

/// Check if a file or directory exists
#[command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// Create a directory (and all parent directories)
#[command]
pub async fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory '{}': {}", path, e))
}

/// Remove a file or directory
#[command]
pub async fn remove_path(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    
    if path.is_dir() {
        fs::remove_dir_all(path)
            .map_err(|e| format!("Failed to remove directory '{}': {}", path.display(), e))
    } else {
        fs::remove_file(path)
            .map_err(|e| format!("Failed to remove file '{}': {}", path.display(), e))
    }
}

/// Rename or move a file/directory
#[command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename '{}' to '{}': {}", old_path, new_path, e))
}
