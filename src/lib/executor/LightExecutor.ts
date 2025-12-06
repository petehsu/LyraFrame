/**
 * 轻量级代码执行器 - 针对视频编辑器优化
 * 
 * 特点：
 * 1. 直接访问 Canvas（无 iframe 延迟）
 * 2. 支持 60fps 动画
 * 3. 易于录制视频
 * 4. 包体积 < 2KB
 */

export interface ExecutorOptions {
    canvas: HTMLCanvasElement;
    onError?: (error: Error) => void;
    timeout?: number; // 执行超时（ms）
}

export class LightExecutor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private onError?: (error: Error) => void;
    private timeout: number;
    private animationId: number | null = null;
    private timeoutId: number | null = null;

    constructor(options: ExecutorOptions) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d')!;
        this.onError = options.onError;
        this.timeout = options.timeout || 30000; // 默认30秒超时
    }

    /**
     * 执行用户代码
     */
    async execute(code: string): Promise<void> {
        // 1. 清理之前的执行
        this.stop();
        this.clear();

        // 2. 包装代码以提供安全环境
        const wrappedCode = this.wrapCode(code);

        // 3. 设置超时保护
        this.timeoutId = window.setTimeout(() => {
            this.stop();
            this.handleError(new Error('代码执行超时'));
        }, this.timeout);

        try {
            // 4. 创建执行函数
            const executor = new Function(
                'canvas',
                'ctx',
                'requestAnimationFrame',
                'cancelAnimationFrame',
                wrappedCode
            );

            // 5. 注入依赖并执行
            await executor(
                this.canvas,
                this.ctx,
                this.createRafWrapper(),
                this.createCafWrapper()
            );
        } catch (error) {
            this.handleError(error as Error);
        } finally {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        }
    }

    /**
     * 停止当前执行
     */
    stop(): void {
        if (this.animationId !== null) {
            window.cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * 清空 Canvas
     */
    clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 包装用户代码，提供受控环境
     */
    private wrapCode(code: string): string {
        return `
            'use strict';
            
            // 禁用危险的全局变量
            const window = undefined;
            const document = undefined;
            const localStorage = undefined;
            const sessionStorage = undefined;
            const fetch = undefined;
            const XMLHttpRequest = undefined;
            
            // 提供安全的 API
            const console = {
                log: (...args) => {
                    // 可以发送到父级或自定义处理
                    parent.console?.log('[UserCode]', ...args);
                },
                error: (...args) => {
                    parent.console?.error('[UserCode]', ...args);
                },
                warn: (...args) => {
                    parent.console?.warn('[UserCode]', ...args);
                }
            };
            
            // 用户代码
            ${code}
        `;
    }

    /**
     * 创建 requestAnimationFrame 包装器（追踪动画ID）
     */
    private createRafWrapper() {
        return (callback: FrameRequestCallback) => {
            this.animationId = window.requestAnimationFrame(callback);
            return this.animationId;
        };
    }

    /**
     * 创建 cancelAnimationFrame 包装器
     */
    private createCafWrapper() {
        return (id: number) => {
            window.cancelAnimationFrame(id);
            if (this.animationId === id) {
                this.animationId = null;
            }
        };
    }

    /**
     * 错误处理
     */
    private handleError(error: Error): void {
        console.error('Executor Error:', error);

        // 在 Canvas 上渲染错误信息
        this.renderError(error.message);

        // 回调通知
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * 在 Canvas 上渲染错误
     */
    private renderError(message: string): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = '20px monospace';
        this.ctx.textBaseline = 'top';

        const lines = this.wrapText(message, this.canvas.width - 40);
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 20, 20 + i * 30);
        });
    }

    /**
     * 文本换行工具
     */
    private wrapText(text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }
}
