/**
 * 音频处理模块
 * 
 * 提供音频波形生成和音频信息获取功能
 * 仅在 Tauri 桌面应用中可用
 */

import { isTauri } from './platform';

/**
 * 波形数据接口
 */
export interface WaveformData {
    /** 采样点数量 */
    sampleCount: number;
    /** 每个采样点的最大振幅 (0.0 - 1.0) */
    peaks: number[];
    /** 每个采样点的最小振幅 (-1.0 - 0.0) */
    valleys: number[];
    /** 音频时长（秒） */
    duration: number;
    /** 采样率 */
    sampleRate: number;
    /** 通道数 */
    channels: number;
}

/**
 * 音频信息接口
 */
export interface AudioInfo {
    /** 音频时长（秒） */
    duration: number;
    /** 采样率 */
    sampleRate: number;
    /** 通道数 */
    channels: number;
    /** 编解码器 */
    codec: string;
}

/**
 * 从音频文件生成波形数据
 * 
 * @param audioPath - 音频文件的绝对路径
 * @param samples - 期望的采样点数量（用于显示，默认 200）
 * @returns 波形数据
 * @throws 在 Web 环境中抛出错误
 */
export async function generateWaveform(
    audioPath: string,
    samples: number = 200
): Promise<WaveformData> {
    if (!isTauri()) {
        throw new Error('generateWaveform is only available in Tauri desktop app');
    }

    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<WaveformData>('generate_waveform', {
        audioPath,
        samples
    });
}

/**
 * 获取音频文件的基本信息
 * 
 * @param audioPath - 音频文件的绝对路径
 * @returns 音频信息
 * @throws 在 Web 环境中抛出错误
 */
export async function getAudioInfo(audioPath: string): Promise<AudioInfo> {
    if (!isTauri()) {
        throw new Error('getAudioInfo is only available in Tauri desktop app');
    }

    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<AudioInfo>('get_audio_info', { audioPath });
}

/**
 * 检查音频处理功能是否可用
 */
export function isAudioProcessingAvailable(): boolean {
    return isTauri();
}
