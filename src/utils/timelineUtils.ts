import type { Clip, Track } from '../store/types';
import { MIN_TRACKS, MAX_TRACKS } from '../config/constants';

// Simple ID generator
export const generateId = () => Math.random().toString(36).substring(2, 9);

// ============== 碰撞检测和裁剪工具函数 ==============

/** 检测两个 clip 是否重叠 */
export const isOverlapping = (a: Clip, b: Clip): boolean => {
    return a.start < b.start + b.duration && a.start + a.duration > b.start;
};

/** 
 * 裁剪被覆盖的 clip，返回新的 clips 数组
 * 关键：更新 movingClip 并裁剪其他重叠的 clips
 */
export const resolveOverlaps = (movingClip: Clip, clips: Clip[]): Clip[] => {
    const movingEnd = movingClip.start + movingClip.duration;

    const result = clips.map(other => {
        // 如果是 movingClip 本身，返回更新后的版本
        if (other.id === movingClip.id) {
            return movingClip;
        }

        // 如果不重叠，保持原样
        if (!isOverlapping(movingClip, other)) {
            return other;
        }

        const otherEnd = other.start + other.duration;

        // Case 1: movingClip 完全覆盖 other → 删除 other
        if (movingClip.start <= other.start && movingEnd >= otherEnd) {
            return { ...other, duration: 0 };
        }

        // Case 2: movingClip 覆盖 other 的左边 → 裁剪 other 的开头
        if (movingClip.start <= other.start && movingEnd > other.start && movingEnd < otherEnd) {
            const newStart = movingEnd;
            const newDuration = otherEnd - movingEnd;
            return {
                ...other,
                start: newStart,
                duration: newDuration
            };
        }

        // Case 3: movingClip 覆盖 other 的右边 → 裁剪 other 的结尾
        if (movingClip.start > other.start && movingClip.start < otherEnd && movingEnd >= otherEnd) {
            return {
                ...other,
                duration: movingClip.start - other.start
            };
        }

        // Case 4: movingClip 在 other 中间 → 裁剪 other 的结尾
        if (movingClip.start > other.start && movingEnd < otherEnd) {
            return {
                ...other,
                duration: movingClip.start - other.start
            };
        }

        return other;
    }).filter(c => c.duration > 0);

    return result;
};

// ============== 智能轨道管理 ==============

/**
 * 智能轨道管理：
 * 1. 删除所有空轨道（不管在什么位置）
 * 2. 在最底部添加 1 个空轨道
 * 3. 至少保留 MIN_TRACKS 个轨道
 * 4. 重新分配 zIndex 和 name
 * 
 * zIndex 规则 (Premiere Pro 风格):
 * - UI 上第一行 (Track 1) = 最高 zIndex = 覆盖其他轨道
 * - UI 上最后一行 = 最低 zIndex = 被其他轨道覆盖
 */
export const normalizeTracks = (tracks: Track[]): Track[] => {
    // Determine max existing zIndex or start fresh
    // If tracks is empty, we just proceed to generation logic


    // 按 zIndex 降序排序 (高的在顶部 UI，覆盖其他)
    const sorted = [...tracks].sort((a, b) => b.zIndex - a.zIndex);

    // 分离有素材和空的轨道
    const nonEmpty = sorted.filter(t => t.clips.length > 0);

    // 重建轨道列表：所有有素材的轨道 + 1 个空轨道
    // zIndex 规则：第一个轨道 (idx=0) 有最高 zIndex
    let result: Track[] = nonEmpty.map((t, idx) => ({
        ...t,
        zIndex: MAX_TRACKS - idx,  // 第一个轨道 zIndex 最高
        name: `Track ${idx + 1}`
    }));

    // 添加 1 个空轨道到底部 (最低 zIndex)
    if (result.length < MAX_TRACKS) {
        result.push({
            id: generateId(),
            name: `Track ${result.length + 1}`,
            type: 'video',
            visible: true,
            locked: false,
            zIndex: MAX_TRACKS - result.length,  // 新轨道 zIndex 更低
            clips: []
        });
    }

    // 确保至少有 MIN_TRACKS 个轨道
    while (result.length < MIN_TRACKS) {
        result.push({
            id: generateId(),
            name: `Track ${result.length + 1}`,
            type: 'video',
            visible: true,
            locked: false,
            zIndex: MAX_TRACKS - result.length,
            clips: []
        });
    }

    return result;
};
