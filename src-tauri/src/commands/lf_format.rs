//! LyraFrame 专有格式编解码器 (.lf)
//! 
//! 格式结构:
//! [LYRA] (4 bytes) - 魔术头
//! [VERSION] (1 byte) - 格式版本
//! [FLAGS] (1 byte) - 标志位
//! [COMPRESSED_DATA] - gzip 压缩的 JSON 数据

use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use std::io::{Read, Write};
use tauri::command;

/// 魔术头 "LYRA"
const MAGIC_HEADER: [u8; 4] = [0x4C, 0x59, 0x52, 0x41];
const FORMAT_VERSION: u8 = 1;

/// 将项目数据编码为 .lf 二进制格式
/// 
/// # Arguments
/// * `data` - JSON 字符串形式的项目数据
/// 
/// # Returns
/// * `Ok(Vec<u8>)` - 编码后的二进制数据
/// * `Err(String)` - 错误信息
#[command]
pub fn encode_lf_format(data: String) -> Result<Vec<u8>, String> {
    // 1. 将 JSON 字符串转换为字节
    let json_bytes = data.as_bytes();
    
    // 2. Gzip 压缩
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(json_bytes)
        .map_err(|e| format!("Failed to compress data: {}", e))?;
    let compressed = encoder.finish()
        .map_err(|e| format!("Failed to finish compression: {}", e))?;
    
    // 3. 构建最终格式: MAGIC + VERSION + FLAGS + COMPRESSED
    let mut result = Vec::with_capacity(MAGIC_HEADER.len() + 2 + compressed.len());
    result.extend_from_slice(&MAGIC_HEADER);
    result.push(FORMAT_VERSION);
    result.push(0); // flags (reserved)
    result.extend_from_slice(&compressed);
    
    Ok(result)
}

/// 将 .lf 二进制格式解码为项目数据
/// 
/// # Arguments
/// * `buffer` - 二进制数据
/// 
/// # Returns
/// * `Ok(String)` - 解码后的 JSON 字符串
/// * `Err(String)` - 错误信息
#[command]
pub fn decode_lf_format(buffer: Vec<u8>) -> Result<String, String> {
    // 1. 验证最小长度
    if buffer.len() < 6 {
        return Err("Invalid .lf file: too short".to_string());
    }
    
    // 2. 验证魔术头
    for i in 0..4 {
        if buffer[i] != MAGIC_HEADER[i] {
            return Err("Invalid .lf file: missing LYRA header".to_string());
        }
    }
    
    // 3. 读取版本
    let version = buffer[4];
    if version > FORMAT_VERSION {
        return Err(format!("Unsupported .lf format version: {}", version));
    }
    
    // 4. 提取压缩数据
    let compressed = &buffer[6..];
    
    // 5. Gzip 解压
    let mut decoder = GzDecoder::new(compressed);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed)
        .map_err(|e| format!("Failed to decompress data: {}", e))?;
    
    // 6. 转换为字符串
    String::from_utf8(decompressed)
        .map_err(|e| format!("Invalid UTF-8 data: {}", e))
}

/// 检查文件是否是有效的 .lf 格式
#[command]
pub fn is_valid_lf_file(buffer: Vec<u8>) -> bool {
    if buffer.len() < 6 {
        return false;
    }
    
    for i in 0..4 {
        if buffer[i] != MAGIC_HEADER[i] {
            return false;
        }
    }
    
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_encode_decode() {
        let data = r#"{"name":"test","version":"1.0.0"}"#.to_string();
        
        // Encode
        let encoded = encode_lf_format(data.clone()).unwrap();
        
        // Verify header
        assert_eq!(&encoded[0..4], &MAGIC_HEADER);
        assert_eq!(encoded[4], FORMAT_VERSION);
        
        // Decode
        let decoded = decode_lf_format(encoded).unwrap();
        assert_eq!(decoded, data);
    }
    
    #[test]
    fn test_is_valid() {
        let data = r#"{"test": true}"#.to_string();
        let encoded = encode_lf_format(data).unwrap();
        
        assert!(is_valid_lf_file(encoded));
        assert!(!is_valid_lf_file(vec![0, 1, 2, 3]));
        assert!(!is_valid_lf_file(vec![]));
    }
}
