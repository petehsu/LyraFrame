/**
 * LyraFrame 专有格式编解码器 (.lf)
 * 
 * 跨平台实现:
 * - Tauri: 使用 Rust 后端 (flate2)
 * - Web: 使用 JavaScript (pako)
 * 
 * 格式结构:
 * [LYRA] (4 bytes) - 魔术头
 * [VERSION] (1 byte) - 格式版本
 * [FLAGS] (1 byte) - 标志位
 * [COMPRESSED_DATA] - gzip 压缩的 JSON 数据
 */

import { isTauri } from './platform';

// 魔术头 "LYRA"
const MAGIC_HEADER = new Uint8Array([0x4C, 0x59, 0x52, 0x41]);
const FORMAT_VERSION = 1;

// ============== Tauri Implementation ==============

async function encodeLfFormatTauri(data: object): Promise<Uint8Array> {
    const { invoke } = await import('@tauri-apps/api/core');
    const jsonString = JSON.stringify(data);
    const result = await invoke<number[]>('encode_lf_format', { data: jsonString });
    return new Uint8Array(result);
}

async function decodeLfFormatTauri(buffer: ArrayBuffer): Promise<object> {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(buffer));
    const jsonString = await invoke<string>('decode_lf_format', { buffer: bytes });
    return JSON.parse(jsonString);
}

async function isValidLfFileTauri(buffer: ArrayBuffer): Promise<boolean> {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(buffer));
    return invoke<boolean>('is_valid_lf_file', { buffer: bytes });
}

// ============== Web Implementation (pako) ==============

async function encodeLfFormatWeb(data: object): Promise<Uint8Array> {
    const pako = await import('pako');

    // 1. 将数据转为 JSON 字符串
    const jsonString = JSON.stringify(data);

    // 2. 转为 UTF-8 字节
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonString);

    // 3. gzip 压缩
    const compressed = pako.deflate(jsonBytes);

    // 4. 构建最终格式: MAGIC + VERSION + FLAGS + COMPRESSED
    const result = new Uint8Array(MAGIC_HEADER.length + 2 + compressed.length);
    result.set(MAGIC_HEADER, 0);
    result[4] = FORMAT_VERSION;
    result[5] = 0; // flags (reserved)
    result.set(compressed, 6);

    return result;
}

async function decodeLfFormatWeb(buffer: ArrayBuffer): Promise<object> {
    const pako = await import('pako');
    const bytes = new Uint8Array(buffer);

    // 1. 验证魔术头
    for (let i = 0; i < MAGIC_HEADER.length; i++) {
        if (bytes[i] !== MAGIC_HEADER[i]) {
            throw new Error('Invalid .lf file: missing LYRA header');
        }
    }

    // 2. 读取版本
    const version = bytes[4];
    if (version > FORMAT_VERSION) {
        throw new Error(`Unsupported .lf format version: ${version}`);
    }

    // 3. 提取压缩数据
    const compressed = bytes.slice(6);

    // 4. 解压
    const decompressed = pako.inflate(compressed);

    // 5. 转为字符串
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);

    // 6. 解析 JSON
    return JSON.parse(jsonString);
}

function isValidLfFileWeb(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 6) return false;

    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < MAGIC_HEADER.length; i++) {
        if (bytes[i] !== MAGIC_HEADER[i]) {
            return false;
        }
    }
    return true;
}

// ============== Unified API ==============

/**
 * 将项目数据编码为 .lf 二进制格式
 */
export async function encodeLfFormat(data: object): Promise<Uint8Array> {
    if (isTauri()) {
        return encodeLfFormatTauri(data);
    }
    return encodeLfFormatWeb(data);
}

/**
 * 将 .lf 二进制格式解码为项目数据
 */
export async function decodeLfFormat(buffer: ArrayBuffer): Promise<object> {
    if (isTauri()) {
        return decodeLfFormatTauri(buffer);
    }
    return decodeLfFormatWeb(buffer);
}

/**
 * 检查文件是否是有效的 .lf 格式
 */
export async function isValidLfFile(buffer: ArrayBuffer): Promise<boolean> {
    if (isTauri()) {
        return isValidLfFileTauri(buffer);
    }
    return isValidLfFileWeb(buffer);
}

// ============== Sync versions for backward compatibility ==============

/**
 * 同步版本 - 仅在 Web 环境可用
 * @deprecated 使用异步版本 encodeLfFormat
 */
export function encodeLfFormatSync(data: object): Uint8Array {
    // 动态导入 pako 不能同步，所以这里直接内联实现
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pako = require('pako');

    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonString);
    const compressed = pako.deflate(jsonBytes);

    const result = new Uint8Array(MAGIC_HEADER.length + 2 + compressed.length);
    result.set(MAGIC_HEADER, 0);
    result[4] = FORMAT_VERSION;
    result[5] = 0;
    result.set(compressed, 6);

    return result;
}

/**
 * 同步版本 - 仅在 Web 环境可用
 * @deprecated 使用异步版本 decodeLfFormat
 */
export function decodeLfFormatSync(buffer: ArrayBuffer): object {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pako = require('pako');
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < MAGIC_HEADER.length; i++) {
        if (bytes[i] !== MAGIC_HEADER[i]) {
            throw new Error('Invalid .lf file: missing LYRA header');
        }
    }

    const version = bytes[4];
    if (version > FORMAT_VERSION) {
        throw new Error(`Unsupported .lf format version: ${version}`);
    }

    const compressed = bytes.slice(6);
    const decompressed = pako.inflate(compressed);
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);

    return JSON.parse(jsonString);
}

/**
 * 同步版本检查
 */
export function isValidLfFileSync(buffer: ArrayBuffer): boolean {
    return isValidLfFileWeb(buffer);
}
