/**
 * 生成 Tauri 应用图标
 * 使用 sharp 库从 SVG 生成各种尺寸的 PNG 图标
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const iconsDir = join(projectRoot, 'src-tauri', 'icons');

// 确保图标目录存在
if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
}

// 读取 SVG
const svgPath = join(projectRoot, 'src', 'assets', 'icon-white-bg.svg');
const svgBuffer = readFileSync(svgPath);

// 图标尺寸配置
const sizes = [
    { name: 'icon.png', size: 1024 },
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'Square30x30Logo.png', size: 30 },
    { name: 'Square44x44Logo.png', size: 44 },
    { name: 'Square71x71Logo.png', size: 71 },
    { name: 'Square89x89Logo.png', size: 89 },
    { name: 'Square107x107Logo.png', size: 107 },
    { name: 'Square142x142Logo.png', size: 142 },
    { name: 'Square150x150Logo.png', size: 150 },
    { name: 'Square284x284Logo.png', size: 284 },
    { name: 'Square310x310Logo.png', size: 310 },
    { name: 'StoreLogo.png', size: 50 },
];

async function generateIcons() {
    console.log('Generating icons from SVG...');

    for (const { name, size } of sizes) {
        const outputPath = join(iconsDir, name);
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath);
        console.log(`  ✓ ${name} (${size}x${size})`);
    }

    console.log('\nAll PNG icons generated!');
    console.log('\nNote: For .ico and .icns files, use:');
    console.log('  npx tauri icon src-tauri/icons/icon.png');
}

generateIcons().catch(console.error);
