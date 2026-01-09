//! 音频波形生成模块
//!
//! 从音频文件中提取振幅数据，用于时间轴显示波形

use std::fs::File;
use std::path::Path;
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::command;

/// 波形数据结构
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WaveformData {
    /// 采样点数量
    pub sample_count: usize,
    /// 每个采样点的最大振幅 (0.0 - 1.0)
    pub peaks: Vec<f32>,
    /// 每个采样点的最小振幅 (-1.0 - 0.0)
    pub valleys: Vec<f32>,
    /// 音频时长（秒）
    pub duration: f64,
    /// 采样率
    pub sample_rate: u32,
    /// 通道数
    pub channels: u8,
}

/// 从音频文件生成波形数据
///
/// # Arguments
/// * `audio_path` - 音频文件路径
/// * `samples` - 期望的采样点数量（用于显示）
///
/// # Returns
/// * `Ok(WaveformData)` - 波形数据
/// * `Err(String)` - 错误信息
#[command]
pub async fn generate_waveform(audio_path: String, samples: u32) -> Result<WaveformData, String> {
    // 在独立线程中处理音频，避免阻塞主线程
    tokio::task::spawn_blocking(move || {
        generate_waveform_sync(&audio_path, samples)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

fn generate_waveform_sync(audio_path: &str, target_samples: u32) -> Result<WaveformData, String> {
    let path = Path::new(audio_path);
    
    // 打开音频文件
    let file = File::open(path)
        .map_err(|e| format!("Failed to open audio file: {}", e))?;
    
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    // 创建格式提示
    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }
    
    // 探测格式
    let format_opts = FormatOptions::default();
    let metadata_opts = MetadataOptions::default();
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .map_err(|e| format!("Failed to probe audio format: {}", e))?;
    
    let mut format = probed.format;
    
    // 获取默认音轨
    let track = format.default_track()
        .ok_or_else(|| "No audio track found".to_string())?;
    
    let sample_rate = track.codec_params.sample_rate
        .ok_or_else(|| "Unknown sample rate".to_string())?;
    let channels = track.codec_params.channels
        .map(|c| c.count() as u8)
        .unwrap_or(2);
    let time_base = track.codec_params.time_base;
    
    // 估算总采样数
    let n_frames = track.codec_params.n_frames.unwrap_or(0);
    let duration = if let Some(tb) = time_base {
        n_frames as f64 * tb.numer as f64 / tb.denom as f64
    } else {
        n_frames as f64 / sample_rate as f64
    };
    
    // 创建解码器
    let dec_opts = DecoderOptions::default();
    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &dec_opts)
        .map_err(|e| format!("Failed to create decoder: {}", e))?;
    
    let track_id = track.id;
    
    // 收集所有样本的最大振幅
    let mut all_samples: Vec<f32> = Vec::new();
    
    // 解码所有包
    loop {
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(symphonia::core::errors::Error::IoError(e)) 
                if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
            Err(e) => {
                log::warn!("Packet read error: {}", e);
                break;
            }
        };
        
        if packet.track_id() != track_id {
            continue;
        }
        
        let decoded = match decoder.decode(&packet) {
            Ok(decoded) => decoded,
            Err(e) => {
                log::warn!("Decode error: {}", e);
                continue;
            }
        };
        
        // 获取样本
        let spec = *decoded.spec();
        let mut sample_buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
        sample_buf.copy_interleaved_ref(decoded);
        
        // 对于多通道，取所有通道的最大值
        let samples = sample_buf.samples();
        for chunk in samples.chunks(channels as usize) {
            let max = chunk.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
            all_samples.push(max);
        }
    }
    
    // 如果没有采样，返回空数据
    if all_samples.is_empty() {
        return Ok(WaveformData {
            sample_count: 0,
            peaks: vec![],
            valleys: vec![],
            duration,
            sample_rate,
            channels,
        });
    }
    
    // 下采样到目标采样数
    let target_samples = target_samples as usize;
    let total_samples = all_samples.len();
    let samples_per_bucket = (total_samples as f64 / target_samples as f64).max(1.0);
    
    let mut peaks = Vec::with_capacity(target_samples);
    let mut valleys = Vec::with_capacity(target_samples);
    
    for i in 0..target_samples {
        let start = (i as f64 * samples_per_bucket) as usize;
        let end = ((i + 1) as f64 * samples_per_bucket) as usize;
        let end = end.min(total_samples);
        
        if start >= total_samples {
            break;
        }
        
        let bucket = &all_samples[start..end];
        let max = bucket.iter().cloned().fold(0.0f32, f32::max);
        
        peaks.push(max);
        valleys.push(-max); // 对称波形
    }
    
    Ok(WaveformData {
        sample_count: peaks.len(),
        peaks,
        valleys,
        duration,
        sample_rate,
        channels,
    })
}

/// 获取音频文件的基本信息
#[command]
pub async fn get_audio_info(audio_path: String) -> Result<AudioInfo, String> {
    tokio::task::spawn_blocking(move || {
        get_audio_info_sync(&audio_path)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioInfo {
    pub duration: f64,
    pub sample_rate: u32,
    pub channels: u8,
    pub codec: String,
}

fn get_audio_info_sync(audio_path: &str) -> Result<AudioInfo, String> {
    let path = Path::new(audio_path);
    let file = File::open(path)
        .map_err(|e| format!("Failed to open audio file: {}", e))?;
    
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }
    
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|e| format!("Failed to probe audio: {}", e))?;
    
    let track = probed.format.default_track()
        .ok_or_else(|| "No audio track found".to_string())?;
    
    let sample_rate = track.codec_params.sample_rate.unwrap_or(0);
    let channels = track.codec_params.channels.map(|c| c.count() as u8).unwrap_or(0);
    let n_frames = track.codec_params.n_frames.unwrap_or(0);
    
    let duration = if let Some(tb) = track.codec_params.time_base {
        n_frames as f64 * tb.numer as f64 / tb.denom as f64
    } else {
        n_frames as f64 / sample_rate as f64
    };
    
    let codec = track.codec_params.codec.to_string();
    
    Ok(AudioInfo {
        duration,
        sample_rate,
        channels,
        codec,
    })
}
