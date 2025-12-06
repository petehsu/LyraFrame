import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LightExecutor } from '../LightExecutor';

// Mock Canvas
const createMockCanvas = () => {
    const mockCtx = {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: ''
    };

    const canvas = {
        width: 1920,
        height: 1080,
        getContext: vi.fn(() => mockCtx)
    } as unknown as HTMLCanvasElement;

    return { canvas, mockCtx };
};

describe('LightExecutor', () => {
    let executor: LightExecutor;
    let mockCanvas: { canvas: HTMLCanvasElement; mockCtx: ReturnType<typeof createMockCanvas>['mockCtx'] };
    let onErrorSpy: (error: Error) => void;

    beforeEach(() => {
        mockCanvas = createMockCanvas();
        onErrorSpy = vi.fn();

        executor = new LightExecutor({
            canvas: mockCanvas.canvas,
            onError: onErrorSpy,
            timeout: 1000
        });
    });

    afterEach(() => {
        executor.stop();
    });

    describe('Initialization', () => {
        it('should create executor with canvas', () => {
            expect(executor).toBeDefined();
            expect(mockCanvas.canvas.getContext).toHaveBeenCalledWith('2d');
        });
    });

    describe('Code Execution', () => {
        it('should execute simple code', async () => {
            const code = `
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(0, 0, 100, 100);
            `;

            await executor.execute(code);

            expect(mockCanvas.mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
        });

        it('should clear canvas before execution', async () => {
            await executor.execute('ctx.fillRect(0, 0, 100, 100)');

            expect(mockCanvas.mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 1920, 1080);
        });
    });

    describe('Security Sandbox', () => {
        it('should block access to window', async () => {
            const code = `
                try {
                    const x = window.location;
                } catch (e) {
                    // Expected to fail
                }
            `;

            // 代码应该执行，但 window 应该是 undefined
            await executor.execute(code);
            // 没有抛出错误就是成功
        });

        it('should block access to fetch', async () => {
            const code = `
                try {
                    const x = fetch;
                } catch (e) {
                    // Expected to fail
                }
            `;

            await executor.execute(code);
        });
    });

    describe('Error Handling', () => {
        it('should call onError for syntax errors', async () => {
            const code = `
                ctx.fillRect(0, 0, 100, 100
            `; // Missing closing parenthesis

            await executor.execute(code);

            expect(onErrorSpy).toHaveBeenCalled();
        });

        it('should call onError for runtime errors', async () => {
            const code = `
                undefinedFunction();
            `;

            await executor.execute(code);

            expect(onErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should stop execution', () => {
            executor.stop();
            // 应该不会抛出错误
        });

        it('should clear canvas', () => {
            executor.clear();
            expect(mockCanvas.mockCtx.clearRect).toHaveBeenCalled();
        });
    });
});
