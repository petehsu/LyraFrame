/**
 * LyraFrame 专有格式编解码器 (.lf)
 * 
 * 格式结构:
 * [LYRA] (4 bytes) - 魔术头
 * [VERSION] (1 byte) - 格式版本
 * [FLAGS] (1 byte) - 标志位
 * [COMPRESSED_DATA] - gzip 压缩的 JSON 数据
 * 
 * 普通编辑器打开只会看到乱码
 */

import pako from 'pako';

// 魔术头 "LYRA"
const MAGIC_HEADER = new Uint8Array([0x4C, 0x59, 0x52, 0x41]); // "LYRA" in ASCII
const FORMAT_VERSION = 1;

/**
 * 将项目数据编码为 .lf 二进制格式
 */
export function encodeLfFormat(data: object): Uint8Array {
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

/**
 * 将 .lf 二进制格式解码为项目数据
 */
export function decodeLfFormat(buffer: ArrayBuffer): object {
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

/**
 * 检查文件是否是有效的 .lf 格式
 */
export function isValidLfFile(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 6) return false;

    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < MAGIC_HEADER.length; i++) {
        if (bytes[i] !== MAGIC_HEADER[i]) {
            return false;
        }
    }
    return true;
}
