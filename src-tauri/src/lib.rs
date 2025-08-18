use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

mod rules;
use rules::*;


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



#[derive(Serialize, Deserialize)]
struct FileInfo {
    name: String,
    path: String,
}



// 旧的结构体已移动到rules.rs模块中



#[derive(Serialize, Deserialize)]
struct FilePermission {
    readable: bool,
    writable: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct FileDetail {
    name: String,
    path: String,
    extension: Option<String>,
    size: u64,
    modified_ms: Option<u64>,
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
async fn get_file_infos(paths: Vec<String>) -> Result<Vec<FileDetail>, String> {
    log_info!("🦀 [后端日志] get_file_infos 被调用，数量: {}", paths.len());
    let mut details: Vec<FileDetail> = Vec::new();

    for p in paths {
        let path = Path::new(&p);
        if !(path.exists() && path.is_file()) {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        let extension = path
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string());

        match fs::metadata(&path) {
            Ok(md) => {
                let size = md.len();
                let modified_ms = md
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_millis() as u64);
                let readonly = md.permissions().readonly();
                let readable = !readonly; // 简化判断
                let writable = !readonly; // 简化判断

                details.push(FileDetail {
                    name,
                    path: p,
                    extension,
                    size,
                    modified_ms,
                    readable,
                    writable,
                });
            }
            Err(e) => {
                log_error!(
                    "🦀 [后端日志] 读取元数据失败: {} — {}",
                    path.display(),
                    e
                );
            }
        }
    }

    Ok(details)
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





/// 预览重命名结果（纯函数式，不触盘）
#[tauri::command]
async fn preview_rename(files: Vec<String>, rule: RenameRule) -> Result<Vec<PreviewResult>, String> {
    log_info!("🦀 [后端日志] preview_rename 被调用");
    log_info!("🦀 [后端日志] 文件数量: {}", files.len());
    log_info!("🦀 [后端日志] 规则: {:?}", rule);
    
    // 验证规则参数
    if let Err(e) = rule.validate() {
        log_error!("🦀 [后端日志] 规则验证失败: {}", e);
        return Err(e);
    }
    
    let mut results = Vec::new();
    let mut new_names = Vec::new();
    
    // 为每个文件生成预览结果
    for (index, file_path) in files.iter().enumerate() {
        let path = Path::new(file_path);
        let original_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        
        match rule.apply_to_filename(&original_name, index) {
            Ok(new_name) => {
                new_names.push(new_name.clone());
                results.push(PreviewResult {
                    original_name: original_name.clone(),
                    new_name: new_name.clone(),
                    has_conflict: false, // 稍后检测
                    has_invalid_chars: rules::has_invalid_chars(&new_name),
                    error_message: None,
                });
            }
            Err(e) => {
                results.push(PreviewResult {
                    original_name: original_name.clone(),
                    new_name: original_name.clone(),
                    has_conflict: false,
                    has_invalid_chars: false,
                    error_message: Some(e),
                });
                new_names.push(original_name);
            }
        }
    }
    
    // 检测冲突
    let conflicts = rules::detect_conflicts(&new_names);
    for (i, result) in results.iter_mut().enumerate() {
        if i < conflicts.len() {
            result.has_conflict = conflicts[i];
        }
    }
    
    log_info!("🦀 [后端日志] 预览生成完成，结果数量: {}", results.len());
    Ok(results)
}

/// 批量执行重命名操作（两阶段改名）
#[tauri::command]
async fn execute_rename_batch(operations: Vec<RenameOperation>) -> Result<BatchRenameResult, String> {
    log_info!("🦀 [后端日志] execute_rename_batch 被调用");
    log_info!("🦀 [后端日志] 操作数量: {}", operations.len());
    
    if operations.is_empty() {
        return Ok(BatchRenameResult {
            success_count: 0,
            failed_count: 0,
            operations: Vec::new(),
            operation_id: Uuid::new_v4().to_string(),
        });
    }
    
    // 权限和路径校验
    for operation in &operations {
        let path = Path::new(&operation.old_path);
        
        if !path.exists() {
            return Err(format!("文件不存在: {}", operation.old_path));
        }
        
        if !path.is_file() {
            return Err(format!("路径不是文件: {}", operation.old_path));
        }
        
        // 检查写权限
        if let Ok(metadata) = path.metadata() {
            if metadata.permissions().readonly() {
                return Err(format!("文件只读，无法重命名: {}", operation.old_path));
            }
        }
    }
    
    let operation_id = Uuid::new_v4().to_string();
    let mut results = Vec::new();
    let mut success_count = 0;
    let mut failed_count = 0;
    
    // 两阶段重命名：先重命名为临时名，再重命名为目标名
    let mut temp_operations = Vec::new();
    
    // 第一阶段：重命名为临时名
    for operation in &operations {
        let old_path = Path::new(&operation.old_path);
        let parent_dir = old_path.parent().unwrap_or(Path::new("."));
        let temp_name = format!("__temp_{}_{}", operation_id, old_path.file_name().unwrap().to_str().unwrap());
        let temp_path = parent_dir.join(&temp_name);
        
        match fs::rename(&old_path, &temp_path) {
            Ok(_) => {
                log_info!("🦀 [后端日志] 第一阶段成功: {:?} -> {:?}", old_path, temp_path);
                temp_operations.push((temp_path, parent_dir.join(&operation.new_name), operation.clone()));
            }
            Err(e) => {
                let error_msg = format!("第一阶段重命名失败: {}", e);
                log_error!("🦀 [后端日志] {}", error_msg);
                results.push(RenameOperationResult {
                    old_path: operation.old_path.clone(),
                    new_path: parent_dir.join(&operation.new_name).to_string_lossy().to_string(),
                    success: false,
                    error_message: Some(error_msg),
                });
                failed_count += 1;
            }
        }
    }
    
    // 第二阶段：重命名为目标名
    for (temp_path, target_path, original_operation) in temp_operations {
        match fs::rename(&temp_path, &target_path) {
            Ok(_) => {
                log_info!("🦀 [后端日志] 第二阶段成功: {:?} -> {:?}", temp_path, target_path);
                results.push(RenameOperationResult {
                    old_path: original_operation.old_path.clone(),
                    new_path: target_path.to_string_lossy().to_string(),
                    success: true,
                    error_message: None,
                });
                success_count += 1;
            }
            Err(e) => {
                let error_msg = format!("第二阶段重命名失败: {}", e);
                log_error!("🦀 [后端日志] {}", error_msg);
                
                // 尝试回滚第一阶段
                if let Err(rollback_err) = fs::rename(&temp_path, &original_operation.old_path) {
                    log_error!("🦀 [后端日志] 回滚失败: {}", rollback_err);
                }
                
                results.push(RenameOperationResult {
                    old_path: original_operation.old_path.clone(),
                    new_path: target_path.to_string_lossy().to_string(),
                    success: false,
                    error_message: Some(error_msg),
                });
                failed_count += 1;
            }
        }
    }
    
    log_info!("🦀 [后端日志] 批量重命名完成，成功: {}，失败: {}", success_count, failed_count);
    
    Ok(BatchRenameResult {
        success_count,
        failed_count,
        operations: results,
        operation_id,
    })
}

/// 单批次撤销接口（v3.0版本）
#[tauri::command]
async fn undo_rename(operation_id: String) -> Result<UndoResult, String> {
    log_info!("🦀 [后端日志] undo_rename 被调用，operation_id: {}", operation_id);
    
    // TODO: 实现撤销逻辑
    // v3.0版本暂时返回未实现错误
    Err("撤销功能将在后续版本中实现".to_string())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            preview_rename,
            execute_rename_batch,
            undo_rename,
            get_files_from_paths, 
            list_files,
            check_file_permission,
            get_file_infos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
