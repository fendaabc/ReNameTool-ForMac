use std::fs;
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
#[macro_use]
extern crate lazy_static;

// 添加日志宏
macro_rules! log_info {
    ($($arg:tt)*) => {
        println!("[INFO] {}", format!($($arg)*));
    };
}

macro_rules! log_error {
    ($($arg:tt)*) => {
        eprintln!("[ERROR] {}", format!($($arg)*));
    };
}

// 多步撤销/重做历史结构
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RenameHistory {
    pub operations: Vec<(String, String)>, // (from, to)
}

lazy_static::lazy_static! {
    pub static ref RENAME_HISTORY_STACK: Mutex<Vec<RenameHistory>> = Mutex::new(Vec::new());
    pub static ref REDO_HISTORY_STACK: Mutex<Vec<RenameHistory>> = Mutex::new(Vec::new());
}

#[derive(Serialize, Deserialize)]
struct FileInfo {
    name: String,
    path: String,
}

#[derive(Serialize, Deserialize)]
struct RenameOperation {
    old_path: String,
    new_name: String,
}

#[derive(Serialize, Deserialize)]
struct RenameResult {
    success: bool,
    count: usize,
    error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ExecuteRenameResult {
    success: bool,
    renamed_count: usize,
    error_message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum RenameRule {
    #[serde(rename = "replace")]
    Replace { find: String, replace: String },
    #[serde(rename = "sequence")]
    Sequence { start: usize, digits: usize, position: String },
    #[serde(rename = "case")]
    Case { #[serde(rename = "caseType")] case_type: String },
}

#[derive(Serialize, Deserialize)]
struct FilePermission {
    readable: bool,
    writable: bool,
}

#[tauri::command]
async fn list_files(paths: Vec<String>) -> Result<Vec<String>, String> {
    log_info!("🦀 [后端日志] list_files 被调用，路径: {:?}", paths);
    get_files_from_paths(paths).await
}

#[tauri::command]
async fn check_file_permission(path: String) -> Result<FilePermission, String> {
    log_info!("🦀 [后端日志] check_file_permission 被调用，路径: {}", path);
    
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Ok(FilePermission {
            readable: false,
            writable: false,
        });
    }
    
    // 检查读权限
    let readable = file_path.metadata()
        .map(|m| !m.permissions().readonly())
        .unwrap_or(false);
    
    // 检查写权限（简单检查，在实际使用中可能需要更复杂的逻辑）
    let writable = file_path.metadata()
        .map(|m| !m.permissions().readonly())
        .unwrap_or(false);
    
    Ok(FilePermission {
        readable,
        writable,
    })
}

#[tauri::command]
async fn get_files_from_paths(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut all_files = Vec::new();
    
    for path_str in paths {
        let path = Path::new(&path_str);
        
        if path.is_file() {
            all_files.push(path_str);
        } else if path.is_dir() {
            // 递归遍历文件夹
            match collect_files_from_dir(path) {
                Ok(mut files) => all_files.append(&mut files),
                Err(e) => return Err(format!("读取文件夹失败 {}: {}", path_str, e)),
            }
        }
    }
    
    Ok(all_files)
}

fn collect_files_from_dir(dir: &Path) -> Result<Vec<String>, std::io::Error> {
    let mut files = Vec::new();
    
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() {
                if let Some(path_str) = path.to_str() {
                    files.push(path_str.to_string());
                }
            } else if path.is_dir() {
                // 递归处理子文件夹
                let mut sub_files = collect_files_from_dir(&path)?;
                files.append(&mut sub_files);
            }
        }
    }
    
    Ok(files)
}

#[tauri::command]
async fn select_files() -> Result<Vec<FileInfo>, String> {
    // 由于 Tauri 2.0 的文件对话框 API 变化，这里返回一个示例
    // 实际使用时需要配置文件系统权限
    Ok(vec![
        FileInfo {
            name: "示例文件1.txt".to_string(),
            path: "/path/to/示例文件1.txt".to_string(),
        },
        FileInfo {
            name: "示例文件2.jpg".to_string(),
            path: "/path/to/示例文件2.jpg".to_string(),
        },
    ])
}

#[tauri::command]
async fn rename_files(operations: Vec<RenameOperation>) -> Result<RenameResult, String> {
    let mut success_count = 0;
    let mut last_error = None;
    
    for operation in operations {
        let old_path = Path::new(&operation.old_path);
        
        if !old_path.exists() {
            last_error = Some(format!("文件不存在: {}", operation.old_path));
            continue;
        }
        
        let parent_dir = old_path.parent().unwrap_or(Path::new("."));
        let new_path = parent_dir.join(&operation.new_name);
        
        match fs::rename(&old_path, &new_path) {
            Ok(_) => success_count += 1,
            Err(e) => {
                last_error = Some(format!("重命名失败 {}: {}", operation.old_path, e));
            }
        }
    }
    
    Ok(RenameResult {
        success: last_error.is_none(),
        count: success_count,
        error: last_error,
    })
}

#[tauri::command]
async fn redo_rename() -> Result<ExecuteRenameResult, String> {
    use std::fs;
    let mut redo_stack = REDO_HISTORY_STACK.lock().unwrap();
    if let Some(history) = redo_stack.pop() {
        let mut stack = RENAME_HISTORY_STACK.lock().unwrap();
        let mut success_count = 0;
        let mut errors = Vec::new();
        // 顺序重做
        for (from, to) in history.operations.iter() {
            match fs::rename(from, to) {
                Ok(_) => success_count += 1,
                Err(e) => errors.push(format!("重做失败 {}: {}", from, e)),
            }
        }
        stack.push(history);
        if errors.is_empty() {
            Ok(ExecuteRenameResult {
                success: true,
                renamed_count: success_count,
                error_message: None,
            })
        } else {
            Ok(ExecuteRenameResult {
                success: false,
                renamed_count: success_count,
                error_message: Some(errors.join("; ")),
            })
        }
    } else {
        Ok(ExecuteRenameResult {
            success: false,
            renamed_count: 0,
            error_message: Some("没有可重做的历史记录".to_string()),
        })
    }
}

#[tauri::command]
async fn execute_rename(file_paths: Vec<String>, rule: RenameRule) -> Result<ExecuteRenameResult, String> {
    log_info!("🦀 [后端日志] execute_rename 被调用");
    log_info!("🦀 [后端日志] 文件路径数量: {}", file_paths.len());
    log_info!("🦀 [后端日志] 文件路径: {:?}", file_paths);
    log_info!("🦀 [后端日志] 重命名规则: {:?}", rule);
    
    if file_paths.is_empty() {
        log_error!("🦀 [后端日志] 没有提供文件路径");
        return Ok(ExecuteRenameResult {
            success: false,
            renamed_count: 0,
            error_message: Some("没有提供文件路径".to_string()),
        });
    }

    // 第一步：验证所有文件是否存在
    log_info!("🦀 [后端日志] 开始验证文件是否存在");
    for file_path in &file_paths {
        let path = Path::new(file_path);
        if !path.exists() {
            log_error!("🦀 [后端日志] 文件不存在: {}", file_path);
            return Ok(ExecuteRenameResult {
                success: false,
                renamed_count: 0,
                error_message: Some(format!("文件不存在: {}", file_path)),
            });
        }
        if !path.is_file() {
            log_error!("🦀 [后端日志] 路径不是文件: {}", file_path);
            return Ok(ExecuteRenameResult {
                success: false,
                renamed_count: 0,
                error_message: Some(format!("路径不是文件: {}", file_path)),
            });
        }
    }
    log_info!("🦀 [后端日志] 所有文件验证通过");

    // 生成新文件名并处理重复
    log_info!("🦀 [后端日志] 开始生成新文件名");
    let mut rename_map: Vec<(PathBuf, PathBuf)> = Vec::new();
    let mut new_name_counts: HashMap<String, usize> = HashMap::new();

    match rule {
        RenameRule::Replace { find, replace } => {
            log_info!("🦀 [后端日志] 处理替换规则: '{}' -> '{}'", find, replace);
            for file_path in &file_paths {
                let old_path = PathBuf::from(file_path);
                let parent_dir = old_path.parent().unwrap_or(Path::new("."));
                let file_name = old_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let new_base_name = file_name.replace(&find, &replace);
                log_info!("🦀 [后端日志] 文件 '{}' -> '{}'", file_name, new_base_name);
                if new_base_name == file_name {
                    log_info!("🦀 [后端日志] 文件名无变化，跳过: {}", file_name);
                    continue;
                }
                let final_new_name = resolve_duplicate_name(&new_base_name, &mut new_name_counts);
                let new_path = parent_dir.join(&final_new_name);
                log_info!("🦀 [后端日志] 添加到重命名映射: {:?} -> {:?}", old_path, new_path);
                rename_map.push((old_path, new_path));
            }
        }
        RenameRule::Sequence { start, digits, position } => {
            let mut seq = start;
            for file_path in &file_paths {
                let old_path = PathBuf::from(file_path);
                let parent_dir = old_path.parent().unwrap_or(Path::new("."));
                let file_name = old_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let (name, ext) = if let Some(dot) = file_name.rfind('.') {
                    (&file_name[..dot], &file_name[dot..])
                } else {
                    (file_name, "")
                };
                let seq_str = format!("{:0width$}", seq, width = digits);
                let new_base_name = match position.as_str() {
                    "prefix" => format!("{}_{}", seq_str, file_name),
                    "suffix" => format!("{}_{}{}", name, seq_str, ext),
                    _ => format!("{}_{}{}", name, seq_str, ext),
                };
                let final_new_name = resolve_duplicate_name(&new_base_name, &mut new_name_counts);
                let new_path = parent_dir.join(&final_new_name);
                rename_map.push((old_path, new_path));
                seq += 1;
            }
        }
        RenameRule::Case { case_type } => {
            for file_path in &file_paths {
                let old_path = PathBuf::from(file_path);
                let parent_dir = old_path.parent().unwrap_or(Path::new("."));
                let file_name = old_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let (name, ext) = if let Some(dot) = file_name.rfind('.') {
                    (&file_name[..dot], &file_name[dot..])
                } else {
                    (file_name, "")
                };
                let new_base_name = match case_type.as_str() {
                    "upper" => format!("{}{}", name.to_uppercase(), ext),
                    "lower" => format!("{}{}", name.to_lowercase(), ext),
                    "capitalize" => {
                        let mut c = name.chars();
                        match c.next() {
                            None => String::new(),
                            Some(f) => format!("{}{}{}", f.to_uppercase(), c.as_str().to_lowercase(), ext),
                        }
                    }
                    _ => format!("{}{}", name, ext),
                };
                if new_base_name == file_name {
                    continue;
                }
                let final_new_name = resolve_duplicate_name(&new_base_name, &mut new_name_counts);
                let new_path = parent_dir.join(&final_new_name);
                rename_map.push((old_path, new_path));
            }
        }
    }

    log_info!("🦀 [后端日志] 生成的重命名映射数量: {}", rename_map.len());
    
    if rename_map.is_empty() {
        log_info!("🦀 [后端日志] 没有文件需要重命名");
        return Ok(ExecuteRenameResult {
            success: true,
            renamed_count: 0,
            error_message: Some("没有文件需要重命名".to_string()),
        });
    }

    // 第三步：执行重命名操作
    log_info!("🦀 [后端日志] 开始执行重命名操作");
    let mut success_count = 0;
    let mut errors = Vec::new();
    let mut op_history: Vec<(String, String)> = Vec::new();

    for (old_path, new_path) in rename_map {
        log_info!("🦀 [后端日志] 重命名: {:?} -> {:?}", old_path, new_path);
        match fs::rename(&old_path, &new_path) {
            Ok(_) => {
                success_count += 1;
                log_info!("🦀 [后端日志] 重命名成功: {:?} -> {:?}", old_path, new_path);
                op_history.push((old_path.to_string_lossy().to_string(), new_path.to_string_lossy().to_string()));
            },
            Err(e) => {
                let error_msg = format!("重命名失败 {}: {}", old_path.display(), e);
                log_error!("🦀 [后端日志] {}", error_msg);
                errors.push(error_msg);
            }
        }
    }

    // 历史入栈，清空redo栈
    if !op_history.is_empty() {
        let mut stack = RENAME_HISTORY_STACK.lock().unwrap();
        stack.push(RenameHistory { operations: op_history });
        let mut redo_stack = REDO_HISTORY_STACK.lock().unwrap();
        redo_stack.clear();
    }

    let result = if errors.is_empty() {
        log_info!("🦀 [后端日志] 重命名操作完成，成功: {}", success_count);
        ExecuteRenameResult {
            success: true,
            renamed_count: success_count,
            error_message: None,
        }
    } else {
        log_error!("🦀 [后端日志] 重命名操作完成，成功: {}，错误: {}", success_count, errors.len());
        ExecuteRenameResult {
            success: false,
            renamed_count: success_count,
            error_message: Some(errors.join("; ")),
        }
    };
    
    log_info!("🦀 [后端日志] 返回结果: {:?}", result);
    Ok(result)
}

// 辅助函数：处理重复文件名
fn resolve_duplicate_name(base_name: &str, name_counts: &mut HashMap<String, usize>) -> String {
    // 分离文件名和扩展名
    let (name_without_ext, extension) = if let Some(dot_pos) = base_name.rfind('.') {
        let name_part = &base_name[..dot_pos];
        let ext_part = &base_name[dot_pos..];
        (name_part, ext_part)
    } else {
        (base_name, "")
    };

    // 检查是否已经存在这个文件名
    let count = name_counts.entry(base_name.to_string()).or_insert(0);
    
    if *count == 0 {
        *count += 1;
        base_name.to_string()
    } else {
        *count += 1;
        format!("{} ({}){}", name_without_ext, *count - 1, extension)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            select_files, 
            rename_files, 
            execute_rename, 
            get_files_from_paths, 
            list_files,
            check_file_permission,
            redo_rename
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
