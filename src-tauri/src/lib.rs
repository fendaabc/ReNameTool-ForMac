use std::fs;
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

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

#[derive(Serialize, Deserialize)]
struct ExecuteRenameResult {
    success: bool,
    renamed_count: usize,
    error_message: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RenameRule {
    #[serde(rename = "replace")]
    Replace { find: String, replace: String },
    #[serde(rename = "sequence")]
    Sequence { start: usize, digits: usize, position: String },
    #[serde(rename = "case")]
    Case { caseType: String },
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
async fn execute_rename(file_paths: Vec<String>, rule: RenameRule) -> Result<ExecuteRenameResult, String> {
    if file_paths.is_empty() {
        return Ok(ExecuteRenameResult {
            success: false,
            renamed_count: 0,
            error_message: Some("没有提供文件路径".to_string()),
        });
    }

    // 第一步：验证所有文件是否存在
    for file_path in &file_paths {
        let path = Path::new(file_path);
        if !path.exists() {
            return Ok(ExecuteRenameResult {
                success: false,
                renamed_count: 0,
                error_message: Some(format!("文件不存在: {}", file_path)),
            });
        }
        if !path.is_file() {
            return Ok(ExecuteRenameResult {
                success: false,
                renamed_count: 0,
                error_message: Some(format!("路径不是文件: {}", file_path)),
            });
        }
    }

    // 生成新文件名并处理重复
    let mut rename_map: Vec<(PathBuf, PathBuf)> = Vec::new();
    let mut new_name_counts: HashMap<String, usize> = HashMap::new();

    match rule {
        RenameRule::Replace { find, replace } => {
            for file_path in &file_paths {
                let old_path = PathBuf::from(file_path);
                let parent_dir = old_path.parent().unwrap_or(Path::new("."));
                let file_name = old_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let new_base_name = file_name.replace(&find, &replace);
                if new_base_name == file_name {
                    continue;
                }
                let final_new_name = resolve_duplicate_name(&new_base_name, &mut new_name_counts);
                let new_path = parent_dir.join(&final_new_name);
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
                    "prefix" => format!("{}{}{}", seq_str, name, ext),
                    "suffix" => format!("{}{}{}", name, seq_str, ext),
                    _ => format!("{}{}{}", name, seq_str, ext),
                };
                let final_new_name = resolve_duplicate_name(&new_base_name, &mut new_name_counts);
                let new_path = parent_dir.join(&final_new_name);
                rename_map.push((old_path, new_path));
                seq += 1;
            }
        }
        RenameRule::Case { caseType } => {
            for file_path in &file_paths {
                let old_path = PathBuf::from(file_path);
                let parent_dir = old_path.parent().unwrap_or(Path::new("."));
                let file_name = old_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let (name, ext) = if let Some(dot) = file_name.rfind('.') {
                    (&file_name[..dot], &file_name[dot..])
                } else {
                    (file_name, "")
                };
                let new_base_name = match caseType.as_str() {
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

    if rename_map.is_empty() {
        return Ok(ExecuteRenameResult {
            success: true,
            renamed_count: 0,
            error_message: Some("没有文件需要重命名（没有包含 'IMG_' 的文件）".to_string()),
        });
    }

    // 第三步：执行重命名操作
    let mut success_count = 0;
    let mut errors = Vec::new();

    for (old_path, new_path) in rename_map {
        match fs::rename(&old_path, &new_path) {
            Ok(_) => {
                success_count += 1;
                println!("成功重命名: {} -> {}", 
                    old_path.display(), 
                    new_path.display()
                );
            }
            Err(e) => {
                let error_msg = format!("重命名失败 {} -> {}: {}", 
                    old_path.display(), 
                    new_path.display(), 
                    e
                );
                errors.push(error_msg);
            }
        }
    }

    // 返回结果
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
        .invoke_handler(tauri::generate_handler![select_files, rename_files, execute_rename, get_files_from_paths])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
