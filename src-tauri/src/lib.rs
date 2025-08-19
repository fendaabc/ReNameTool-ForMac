use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tauri_plugin_store::StoreExt;
use serde_json::json;

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

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::task;
use futures::future::join_all;

/// 批量执行重命名操作（两阶段并发重命名）
#[tauri::command]
async fn execute_rename_batch(
    app_handle: tauri::AppHandle,
    operations: Vec<RenameOperation>,
) -> Result<BatchRenameResult, String> {
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

    // 生成唯一操作ID
    let operation_id = Uuid::new_v4().to_string();
    let _operation_id_clone = operation_id.clone();
    let results = Arc::new(tokio::sync::Mutex::new(Vec::with_capacity(operations.len())));
    let success_count = Arc::new(AtomicUsize::new(0));
    let failed_count = Arc::new(AtomicUsize::new(0));
    
    // 初始化操作结果

    // 验证所有文件
    for op in &operations {
        let path = Path::new(&op.old_path);
        
        if !path.exists() {
            return Err(format!("文件不存在: {}", op.old_path));
        }
        
        if !path.is_file() {
            return Err(format!("路径不是文件: {}", op.old_path));
        }
        
        if let Ok(metadata) = path.metadata() {
            if metadata.permissions().readonly() {
                return Err(format!("文件只读，无法重命名: {}", op.old_path));
            }
        }
    }
    
    // 第一阶段：并发重命名为临时名
    let phase1_futures = operations.into_iter().map(|op| {
        let results = Arc::clone(&results);
        let success_count = Arc::clone(&success_count);
        let failed_count = Arc::clone(&failed_count);
        
        task::spawn_blocking(move || {
            let old_path = Path::new(&op.old_path);
            let parent_dir = old_path.parent().unwrap_or_else(|| Path::new("."));
            
            // 生成更安全的临时文件名
            let temp_name = format!(".__temp_{}_{}", 
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis(),
                old_path.file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or("file")
            );
            let temp_path = parent_dir.join(&temp_name);
            let target_path = parent_dir.join(&op.new_name);
            
            // 执行重命名
            match std::fs::rename(&old_path, &temp_path) {
                Ok(_) => {
                    log_info!("🦀 [后端日志] 第一阶段成功: {:?} -> {:?}", old_path, temp_path);
                    success_count.fetch_add(1, Ordering::SeqCst);
                    Some((temp_path, target_path, op))
                }
                Err(e) => {
                    let error_msg = format!("第一阶段重命名失败: {}", e);
                    log_error!("🦀 [后端日志] {}", error_msg);
                    
                    let mut results = results.blocking_lock();
                    results.push(RenameOperationResult {
                        old_path: op.old_path.clone(),
                        new_path: target_path.to_string_lossy().to_string(),
                        success: false,
                        error_message: Some(error_msg),
                    });
                    failed_count.fetch_add(1, Ordering::SeqCst);
                    None
                }
            }
        })
    });

    // 等待所有第一阶段操作完成
    let phase1_results = join_all(phase1_futures).await;
    
    // 收集成功的临时重命名操作
    let mut temp_operations = Vec::new();
    for result in phase1_results {
        match result {
            Ok(Some(op)) => temp_operations.push(op),
            Ok(None) => continue, // 错误已在第一阶段处理
            Err(e) => {
                log_error!("🦀 [后端日志] 任务执行错误: {}", e);
                failed_count.fetch_add(1, Ordering::SeqCst);
            }
        }
    }
    
    // 第二阶段：并发重命名为目标名
    let phase2_futures = temp_operations.into_iter().map(|(temp_path, target_path, op)| {
        let results = Arc::clone(&results);
        let success_count = Arc::clone(&success_count);
        let failed_count = Arc::clone(&failed_count);
        
        task::spawn_blocking(move || {
            match std::fs::rename(&temp_path, &target_path) {
                Ok(_) => {
                    log_info!("🦀 [后端日志] 第二阶段成功: {:?} -> {:?}", temp_path, target_path);
                    
                    let mut results = results.blocking_lock();
                    results.push(RenameOperationResult {
                        old_path: op.old_path.clone(),
                        new_path: target_path.to_string_lossy().to_string(),
                        success: true,
                        error_message: None,
                    });
                    success_count.fetch_add(1, Ordering::SeqCst);
                }
                Err(e) => {
                    let error_msg = format!("第二阶段重命名失败: {}", e);
                    log_error!("🦀 [后端日志] {}", error_msg);
                    
                    // 尝试回滚第一阶段
                    if let Err(rollback_err) = std::fs::rename(&temp_path, &op.old_path) {
                        log_error!("🦀 [后端日志] 回滚失败: {}", rollback_err);
                    }
                    
                    let mut results = results.blocking_lock();
                    results.push(RenameOperationResult {
                        old_path: op.old_path.clone(),
                        new_path: target_path.to_string_lossy().to_string(),
                        success: false,
                        error_message: Some(error_msg),
                    });
                    failed_count.fetch_add(1, Ordering::SeqCst);
                }
            }
        })
    });

    // 等待所有第二阶段操作完成
    join_all(phase2_futures).await;
    
    // 获取最终结果
    let final_results = Arc::try_unwrap(results)
        .map(|m| m.into_inner())
        .unwrap_or_else(|_| Vec::new());
    
    let success = success_count.load(Ordering::SeqCst);
    let failed = failed_count.load(Ordering::SeqCst);
    
    log_info!("🦀 [后端日志] 批量重命名完成，成功: {}，失败: {}", success, failed);
    
    // 保存操作记录
    save_operation_record(&app_handle, &operation_id, &final_results)?;
    
    // 返回结果
    Ok(BatchRenameResult {
        success_count: success,
        failed_count: failed,
        operations: final_results,
        operation_id,
    })
}

// 定义存储操作记录的键名
const RENAME_OPERATIONS_KEY: &str = "rename_operations";

/// 保存操作记录到本地存储
fn save_operation_record(
    app_handle: &tauri::AppHandle,
    operation_id: &str,
    results: &[RenameOperationResult],
) -> Result<(), String> {
    // 创建或加载存储
    let store = app_handle.store("rename_operations.json")
        .map_err(|e| format!("无法创建或加载存储: {}", e))?;
    
    // 加载现有记录
    let mut all_operations: std::collections::HashMap<String, Vec<RenameOperationResult>> = 
        match store.get(RENAME_OPERATIONS_KEY) {
            Some(value) => serde_json::from_value(value.clone())
                .map_err(|e| format!("解析存储数据失败: {}", e))?,
            None => std::collections::HashMap::new(),
        };
    
    // 更新记录
    all_operations.insert(operation_id.to_string(), results.to_owned());
    
    // 保存回存储
    store.set(RENAME_OPERATIONS_KEY.to_string(), json!(all_operations));
    store.save().map_err(|e| e.to_string())?;
    
    Ok(())
}

/// 从本地存储加载操作记录
fn load_operation_record(
    app_handle: &tauri::AppHandle,
    operation_id: &str,
) -> Result<Vec<RenameOperationResult>, String> {
    // 创建或加载存储
    let store = app_handle.store("rename_operations.json")
        .map_err(|e| format!("无法创建或加载存储: {}", e))?;
    
    // 加载所有记录
    let all_operations: std::collections::HashMap<String, Vec<RenameOperationResult>> = 
        match store.get(RENAME_OPERATIONS_KEY) {
            Some(value) => serde_json::from_value(value.clone())
                .map_err(|e| format!("解析存储数据失败: {}", e))?,
            None => return Err(format!("找不到操作ID: {}", operation_id)),
        };
    
    // 获取指定ID的记录
    all_operations
        .get(operation_id)
        .cloned()
        .ok_or_else(|| format!("找不到操作ID: {}", operation_id))
}

/// 单批次撤销接口（v3.0版本）
#[tauri::command]
async fn undo_rename(
    app_handle: tauri::AppHandle,
    operation_id: String,
) -> Result<UndoResult, String> {
    log_info!("🦀 [后端日志] undo_rename 被调用，operation_id: {}", operation_id);
    
    // 检查操作ID是否有效
    if operation_id.is_empty() {
        return Err("操作ID不能为空".to_string());
    }
    
    // 加载操作记录
    let operation_results = load_operation_record(&app_handle, &operation_id)?;
    
    let mut restored_count = 0;
    let mut error_message = None;
    
    // 遍历操作结果，将文件重命名回原始名称
    for op in operation_results {
        if !op.success {
            continue; // 跳过失败的操作
        }
        
        let old_path = Path::new(&op.new_path);
        let new_path = Path::new(&op.old_path);
        
        // 检查文件是否存在
        if !old_path.exists() {
            log_error!("🦀 [后端日志] 文件不存在，无法撤销: {}", op.new_path);
            error_message = Some(format!("文件不存在: {}", op.new_path));
            continue;
        }
        
        // 检查目标路径是否已存在
        if new_path.exists() {
            log_error!("🦀 [后端日志] 目标文件已存在，无法撤销: {}", op.old_path);
            error_message = Some(format!("目标文件已存在: {}", op.old_path));
            continue;
        }
        
        // 执行重命名操作
        match std::fs::rename(old_path, new_path) {
            Ok(_) => {
                log_info!("🦀 [后端日志] 撤销成功: {} -> {}", op.new_path, op.old_path);
                restored_count += 1;
            }
            Err(e) => {
                log_error!("🦀 [后端日志] 撤销失败: {} -> {}: {}", op.new_path, op.old_path, e);
                error_message = Some(format!("撤销失败: {}", e));
            }
        }
    }
    
    // 返回撤销结果
    Ok(UndoResult {
        success: restored_count > 0,
        restored_count,
        error_message,
    })
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
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
