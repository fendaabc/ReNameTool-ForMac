use serde::{Deserialize, Serialize};

/// 重命名规则枚举 - 支持v3.0的五种规则类型
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum RenameRule {
    #[serde(rename = "replace")]
    Replace {
        find: String,
        replace: String,
        #[serde(default)]
        regex: bool,
        #[serde(default)]
        case_sensitive: bool,
    },
    #[serde(rename = "sequence")]
    Sequence {
        start: i64,
        #[serde(default = "default_step")]
        step: i64,
        #[serde(default = "default_width")]
        width: usize,
        #[serde(default = "default_order")]
        order: String,
    },
    #[serde(rename = "slice")]
    Slice {
        start: isize,
        end: Option<isize>,
        replacement: String,
    },
    #[serde(rename = "case")]
    Case {
        #[serde(rename = "caseType")]
        mode: String, // upper|lower|title|snake|kebab
    },
    #[serde(rename = "extension")]
    Extension {
        new_extension: Option<String>,
        #[serde(default)]
        keep_original: bool,
    },
}

/// 预览结果
#[derive(Serialize, Deserialize, Debug)]
pub struct PreviewResult {
    pub original_name: String,
    pub new_name: String,
    pub has_conflict: bool,
    pub has_invalid_chars: bool,
    pub error_message: Option<String>,
}

/// 批量重命名结果
#[derive(Serialize, Deserialize, Debug)]
pub struct BatchRenameResult {
    pub success_count: usize,
    pub failed_count: usize,
    pub operations: Vec<RenameOperationResult>,
    pub operation_id: String,
}

/// 单个重命名操作结果
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenameOperationResult {
    pub old_path: String,
    pub new_path: String,
    pub success: bool,
    pub error_message: Option<String>,
}

/// 重命名操作
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RenameOperation {
    pub old_path: String,
    pub new_name: String,
}

/// 撤销结果
#[derive(Serialize, Deserialize, Debug)]
pub struct UndoResult {
    pub success: bool,
    pub restored_count: usize,
    pub error_message: Option<String>,
}

// 默认值函数
fn default_step() -> i64 { 1 }
fn default_width() -> usize { 2 }
fn default_order() -> String { "current".to_string() }

impl RenameRule {
    /// 验证规则参数是否有效
    pub fn validate(&self) -> Result<(), String> {
        match self {
            RenameRule::Replace { find, .. } => {
                if find.is_empty() {
                    return Err("查找内容不能为空".to_string());
                }
                Ok(())
            }
            RenameRule::Sequence { start, step, width, .. } => {
                if *start < 0 {
                    return Err("起始数字不能小于0".to_string());
                }
                if *step <= 0 {
                    return Err("步长必须大于0".to_string());
                }
                if *width == 0 || *width > 10 {
                    return Err("数字位数必须在1-10之间".to_string());
                }
                Ok(())
            }
            RenameRule::Slice { start, end, .. } => {
                if *start < 0 && start.abs() > 255 {
                    return Err("起始位置超出范围".to_string());
                }
                if let Some(end_pos) = end {
                    if *end_pos < 0 && end_pos.abs() > 255 {
                        return Err("结束位置超出范围".to_string());
                    }
                    if *end_pos != -1 && *end_pos <= *start {
                        return Err("结束位置必须大于起始位置".to_string());
                    }
                }
                Ok(())
            }
            RenameRule::Case { mode } => {
                match mode.as_str() {
                    "upper" | "lower" | "title" | "snake" | "kebab" => Ok(()),
                    _ => Err("不支持的大小写转换模式".to_string()),
                }
            }
            RenameRule::Extension { new_extension, keep_original } => {
                if !keep_original && new_extension.is_none() {
                    return Err("必须指定新扩展名或选择保留原扩展名".to_string());
                }
                if let Some(ext) = new_extension {
                    if !ext.chars().all(|c| c.is_alphanumeric()) {
                        return Err("扩展名只能包含字母和数字".to_string());
                    }
                }
                Ok(())
            }
        }
    }

    /// 应用规则到单个文件名，返回新文件名
    pub fn apply_to_filename(&self, filename: &str, index: usize) -> Result<String, String> {
        match self {
            RenameRule::Replace { find, replace, regex, case_sensitive } => {
                self.apply_replace(filename, find, replace, *regex, *case_sensitive)
            }
            RenameRule::Sequence { start, step, width, order: _ } => {
                self.apply_sequence(filename, *start, *step, *width, index)
            }
            RenameRule::Slice { start, end, replacement } => {
                self.apply_slice(filename, *start, *end, replacement)
            }
            RenameRule::Case { mode } => {
                self.apply_case(filename, mode)
            }
            RenameRule::Extension { new_extension, keep_original } => {
                self.apply_extension(filename, new_extension.as_deref(), *keep_original)
            }
        }
    }

    fn apply_replace(&self, filename: &str, find: &str, replace: &str, regex: bool, case_sensitive: bool) -> Result<String, String> {
        if regex {
            // TODO: 实现正则表达式替换
            // 暂时使用简单字符串替换
            if case_sensitive {
                Ok(filename.replace(find, replace))
            } else {
                Ok(filename.to_lowercase().replace(&find.to_lowercase(), replace))
            }
        } else {
            if case_sensitive {
                Ok(filename.replace(find, replace))
            } else {
                // 大小写不敏感的替换
                let lower_filename = filename.to_lowercase();
                let lower_find = find.to_lowercase();
                if let Some(pos) = lower_filename.find(&lower_find) {
                    let mut result = filename.to_string();
                    result.replace_range(pos..pos + find.len(), replace);
                    Ok(result)
                } else {
                    Ok(filename.to_string())
                }
            }
        }
    }

    fn apply_sequence(&self, filename: &str, start: i64, step: i64, width: usize, index: usize) -> Result<String, String> {
        let sequence_number = start + (index as i64 * step);
        let sequence_str = format!("{:0width$}", sequence_number, width = width);
        
        // 分离文件名和扩展名
        let (name_part, ext_part) = split_filename(filename);
        
        // 默认添加到后缀位置（文件名后，扩展名前）
        Ok(format!("{}_{}{}", name_part, sequence_str, ext_part))
    }

    fn apply_slice(&self, filename: &str, start: isize, end: Option<isize>, replacement: &str) -> Result<String, String> {
        // 分离文件名和扩展名
        let (name_part, ext_part) = split_filename(filename);
        
        let name_chars: Vec<char> = name_part.chars().collect();
        let len = name_chars.len() as isize;
        
        // 处理负索引
        let start_idx = if start < 0 {
            std::cmp::max(0, len + start) as usize
        } else {
            std::cmp::min(start as usize, name_chars.len())
        };
        
        let end_idx = match end {
            Some(e) if e < 0 => std::cmp::max(0, len + e) as usize,
            Some(e) => std::cmp::min(e as usize, name_chars.len()),
            None => name_chars.len(),
        };
        
        if start_idx > end_idx {
            return Err("起始位置不能大于结束位置".to_string());
        }
        
        // 构建新文件名
        let mut result = String::new();
        result.push_str(&name_chars[..start_idx].iter().collect::<String>());
        result.push_str(replacement);
        result.push_str(&name_chars[end_idx..].iter().collect::<String>());
        result.push_str(&ext_part);
        
        Ok(result)
    }

    fn apply_case(&self, filename: &str, mode: &str) -> Result<String, String> {
        // 分离文件名和扩展名
        let (name_part, ext_part) = split_filename(filename);
        
        let new_name = match mode {
            "upper" => name_part.to_uppercase(),
            "lower" => name_part.to_lowercase(),
            "title" => {
                let mut result = String::new();
                let mut capitalize_next = true;
                for c in name_part.chars() {
                    if c.is_alphabetic() {
                        if capitalize_next {
                            result.push(c.to_uppercase().next().unwrap_or(c));
                            capitalize_next = false;
                        } else {
                            result.push(c.to_lowercase().next().unwrap_or(c));
                        }
                    } else {
                        result.push(c);
                        capitalize_next = true;
                    }
                }
                result
            }
            "snake" => {
                name_part
                    .chars()
                    .map(|c| {
                        if c.is_whitespace() || c == '-' {
                            '_'
                        } else {
                            c.to_lowercase().next().unwrap_or(c)
                        }
                    })
                    .collect()
            }
            "kebab" => {
                name_part
                    .chars()
                    .map(|c| {
                        if c.is_whitespace() || c == '_' {
                            '-'
                        } else {
                            c.to_lowercase().next().unwrap_or(c)
                        }
                    })
                    .collect()
            }
            _ => return Err(format!("不支持的大小写模式: {}", mode)),
        };
        
        Ok(format!("{}{}", new_name, ext_part))
    }

    fn apply_extension(&self, filename: &str, new_extension: Option<&str>, keep_original: bool) -> Result<String, String> {
        let (name_part, _current_ext) = split_filename(filename);
        
        if keep_original {
            Ok(filename.to_string())
        } else if let Some(new_ext) = new_extension {
            if new_ext.is_empty() {
                // 移除扩展名
                Ok(name_part)
            } else {
                // 添加或替换扩展名
                Ok(format!("{}.{}", name_part, new_ext))
            }
        } else {
            // 移除扩展名
            Ok(name_part)
        }
    }
}

/// 分离文件名和扩展名
fn split_filename(filename: &str) -> (String, String) {
    if let Some(dot_pos) = filename.rfind('.') {
        let name_part = filename[..dot_pos].to_string();
        let ext_part = filename[dot_pos..].to_string();
        (name_part, ext_part)
    } else {
        (filename.to_string(), String::new())
    }
}

/// 检查文件名是否包含非法字符
pub fn has_invalid_chars(filename: &str) -> bool {
    // Windows和macOS的非法字符
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    filename.chars().any(|c| invalid_chars.contains(&c) || (c as u32) < 32)
}

/// 检测文件名冲突
pub fn detect_conflicts(filenames: &[String]) -> Vec<bool> {
    let mut conflicts = vec![false; filenames.len()];
    
    for i in 0..filenames.len() {
        for j in (i + 1)..filenames.len() {
            if filenames[i].to_lowercase() == filenames[j].to_lowercase() {
                conflicts[i] = true;
                conflicts[j] = true;
            }
        }
    }
    
    conflicts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_replace_rule() {
        let rule = RenameRule::Replace {
            find: "IMG_".to_string(),
            replace: "Photo_".to_string(),
            regex: false,
            case_sensitive: true,
        };
        
        assert_eq!(rule.apply_to_filename("IMG_001.jpg", 0).unwrap(), "Photo_001.jpg");
        assert_eq!(rule.apply_to_filename("document.txt", 0).unwrap(), "document.txt");
    }

    #[test]
    fn test_sequence_rule() {
        let rule = RenameRule::Sequence {
            start: 1,
            step: 1,
            width: 3,
            order: "current".to_string(),
        };
        
        assert_eq!(rule.apply_to_filename("photo.jpg", 0).unwrap(), "photo_001.jpg");
        assert_eq!(rule.apply_to_filename("photo.jpg", 4).unwrap(), "photo_005.jpg");
    }

    #[test]
    fn test_case_rule() {
        let rule = RenameRule::Case {
            mode: "upper".to_string(),
        };
        
        assert_eq!(rule.apply_to_filename("hello world.txt", 0).unwrap(), "HELLO WORLD.txt");
        
        let rule = RenameRule::Case {
            mode: "snake".to_string(),
        };
        
        assert_eq!(rule.apply_to_filename("hello world.txt", 0).unwrap(), "hello_world.txt");
    }

    #[test]
    fn test_slice_rule() {
        let rule = RenameRule::Slice {
            start: 0,
            end: Some(5),
            replacement: "new".to_string(),
        };
        
        assert_eq!(rule.apply_to_filename("hello_world.txt", 0).unwrap(), "new_world.txt");
    }

    #[test]
    fn test_extension_rule() {
        let rule = RenameRule::Extension {
            new_extension: Some("pdf".to_string()),
            keep_original: false,
        };
        
        assert_eq!(rule.apply_to_filename("document.txt", 0).unwrap(), "document.pdf");
        
        let rule = RenameRule::Extension {
            new_extension: None,
            keep_original: false,
        };
        
        assert_eq!(rule.apply_to_filename("document.txt", 0).unwrap(), "document");
    }

    #[test]
    fn test_invalid_chars() {
        assert!(has_invalid_chars("file<name>.txt"));
        assert!(has_invalid_chars("file|name.txt"));
        assert!(!has_invalid_chars("filename.txt"));
    }
}