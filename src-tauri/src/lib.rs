mod commands;

use commands::file_system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File system commands
            file_system::read_dir,
            file_system::read_file,
            file_system::read_text_file,
            file_system::write_file,
            file_system::write_text_file,
            file_system::file_exists,
            file_system::create_dir,
            file_system::remove_path,
            file_system::rename_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
