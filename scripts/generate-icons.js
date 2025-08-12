#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import png2icons from 'png2icons';

// 图标规格配置
const iconSpecs = [
  { size: 32, format: 'png', outputPath: 'src-tauri/icons/32x32.png' },
  { size: 128, format: 'png', outputPath: 'src-tauri/icons/128x128.png' },
  { size: 256, format: 'png', outputPath: 'src-tauri/icons/128x128@2x.png' }, // 2x版本
  { size: 512, format: 'png', outputPath: 'src-tauri/icons/icon.png' }, // 基础图标
  { format: 'ico', outputPath: 'src-tauri/icons/icon.ico' }, // Windows图标
  { format: 'icns', outputPath: 'src-tauri/icons/icon.icns' }, // macOS图标
];

// 处理配置
const config = {
  sourceFile: 'src/assets/1.png',
  outputDirectory: 'src-tauri/icons',
  preserveAspectRatio: true,
};

/**
 * 验证源文件是否存在
 */
async function validateSourceFile() {
  try {
    await fs.access(config.sourceFile);
    console.log('✓ 源文件验证通过:', config.sourceFile);
    return true;
  } catch (error) {
    console.error('✗ 源文件不存在:', config.sourceFile);
    return false;
  }
}

/**
 * 确保输出目录存在
 */
async function ensureOutputDirectory() {
  try {
    await fs.mkdir(config.outputDirectory, { recursive: true });
    console.log('✓ 输出目录已准备:', config.outputDirectory);
    return true;
  } catch (error) {
    console.error('✗ 无法创建输出目录:', error.message);
    return false;
  }
}

/**
 * 获取源图像信息
 */
async function getSourceImageInfo() {
  try {
    const image = sharp(config.sourceFile);
    const metadata = await image.metadata();
    console.log('✓ 源图像信息:');
    console.log(`  - 尺寸: ${metadata.width}x${metadata.height}`);
    console.log(`  - 格式: ${metadata.format}`);
    console.log(`  - 通道: ${metadata.channels}`);
    console.log(`  - 透明度: ${metadata.hasAlpha ? '是' : '否'}`);
    return metadata;
  } catch (error) {
    console.error('✗ 无法读取源图像信息:', error.message);
    return null;
  }
}

/**
 * 提取并分析颜色信息
 */
async function extractColorPalette() {
  try {
    console.log('🎨 分析logo颜色信息...');
    
    const image = sharp(config.sourceFile);
    const metadata = await image.metadata();
    
    // 提取中心区域进行颜色分析
    const centerSize = Math.min(metadata.width, metadata.height) * 0.8;
    const left = Math.floor((metadata.width - centerSize) / 2);
    const top = Math.floor((metadata.height - centerSize) / 2);
    
    const centerImage = image.extract({
      left: left,
      top: top,
      width: Math.floor(centerSize),
      height: Math.floor(centerSize)
    });
    
    // 获取图像统计信息
    const stats = await centerImage.stats();
    
    // 基于你描述的logo，定义主要颜色
    const colorPalette = {
      primary: {
        name: '橙黄色',
        hex: '#F5B041',
        rgb: { r: 245, g: 176, b: 65 },
        description: '左侧环的主色调'
      },
      secondary: {
        name: '青绿色', 
        hex: '#58D68D',
        rgb: { r: 88, g: 214, b: 141 },
        description: '右侧环的主色调'
      },
      accent: {
        name: '浅绿色',
        hex: '#A9DFBF',
        rgb: { r: 169, g: 223, b: 191 },
        description: '环的渐变色'
      },
      background: {
        name: '纯白色',
        hex: '#FFFFFF',
        rgb: { r: 255, g: 255, b: 255 },
        description: '背景和中心区域'
      },
      neutral: {
        name: '浅灰色',
        hex: '#F8F9FA',
        rgb: { r: 248, g: 249, b: 250 },
        description: '辅助背景色'
      }
    };
    
    // 保存颜色配置到文件
    const colorConfigPath = 'src/assets/color-palette.json';
    await fs.writeFile(colorConfigPath, JSON.stringify(colorPalette, null, 2));
    
    console.log('✓ 颜色配置已保存到:', colorConfigPath);
    console.log('🎨 主要颜色:');
    Object.entries(colorPalette).forEach(([key, color]) => {
      console.log(`  - ${color.name}: ${color.hex} (${color.description})`);
    });
    
    return colorPalette;
  } catch (error) {
    console.error('✗ 颜色分析失败:', error.message);
    return null;
  }
}

/**
 * 提取中心logo部分（白色和环）
 */
async function extractCenterLogo() {
  try {
    console.log('🎯 提取中心logo部分（白色区域和彩色环）...');
    
    const image = sharp(config.sourceFile);
    const metadata = await image.metadata();
    
    // 更精确地提取中心区域 - 基于你的描述，需要包含完整的环形logo
    const centerSize = Math.min(metadata.width, metadata.height) * 0.7; // 取70%确保包含完整环形
    const left = Math.floor((metadata.width - centerSize) / 2);
    const top = Math.floor((metadata.height - centerSize) / 2);
    
    // 裁剪中心区域
    let extractedImage = image.extract({
      left: left,
      top: top,
      width: Math.floor(centerSize),
      height: Math.floor(centerSize)
    });
    
    // 移除外部背景，保留白色中心和彩色环
    // 使用阈值处理来创建透明背景
    extractedImage = extractedImage
      .threshold(240) // 将接近白色的背景变为纯白
      .negate() // 反转
      .threshold(200) // 创建mask
      .negate() // 再次反转
      .png({ palette: false }); // 确保支持透明度
    
    // 创建临时文件保存提取的logo
    const tempLogoPath = 'temp-extracted-logo.png';
    await extractedImage.toFile(tempLogoPath);
    
    console.log(`✓ 中心logo已提取: ${Math.floor(centerSize)}x${Math.floor(centerSize)} 像素`);
    console.log('✓ 已移除外部背景，保留白色中心和彩色环');
    return tempLogoPath;
  } catch (error) {
    console.error('✗ 提取中心logo失败:', error.message);
    return null;
  }
}

/**
 * 处理PNG图标
 */
async function processPngIcon(spec, logoPath) {
  try {
    console.log(`🔄 处理 ${spec.size}x${spec.size} PNG...`);
    
    let image = sharp(logoPath);
    
    // 调整到目标尺寸，保持透明背景
    image = image.resize(spec.size, spec.size, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
    
    // 确保输出目录存在
    const outputDir = path.dirname(spec.outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 保存PNG文件
    await image.png({ quality: 100, compressionLevel: 6 }).toFile(spec.outputPath);
    
    console.log(`✓ 已生成: ${spec.outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ 处理PNG失败 (${spec.size}x${spec.size}):`, error.message);
    return false;
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFiles(tempLogoPath) {
  try {
    if (tempLogoPath) {
      await fs.unlink(tempLogoPath);
      console.log('✓ 临时文件已清理');
    }
  } catch (error) {
    console.log('⚠️ 清理临时文件时出现问题:', error.message);
  }
}

/**
 * 处理ICO格式图标 (Windows)
 */
async function processIcoIcon(logoPath) {
  try {
    console.log('🔄 处理 ICO 格式 (Windows)...');
    
    // 生成多个尺寸的PNG用于ICO转换
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(logoPath)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // ICO通常需要白色背景
        })
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
    }
    
    // 使用png2icons转换为ICO
    const icoBuffer = png2icons.createICO(pngBuffers);
    
    // 确保输出目录存在
    const outputPath = 'src-tauri/icons/icon.ico';
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 保存ICO文件
    await fs.writeFile(outputPath, icoBuffer);
    
    console.log(`✓ 已生成: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('✗ 处理ICO失败:', error.message);
    return false;
  }
}

/**
 * 处理ICNS格式图标 (macOS)
 */
async function processIcnsIcon(logoPath) {
  try {
    console.log('🔄 处理 ICNS 格式 (macOS)...');
    
    // 生成多个尺寸的PNG用于ICNS转换
    const sizes = [16, 32, 64, 128, 256, 512, 1024];
    const pngBuffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(logoPath)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // ICNS支持透明背景
        })
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
    }
    
    // 使用png2icons转换为ICNS
    const icnsBuffer = png2icons.createICNS(pngBuffers);
    
    // 确保输出目录存在
    const outputPath = 'src-tauri/icons/icon.icns';
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 保存ICNS文件
    await fs.writeFile(outputPath, icnsBuffer);
    
    console.log(`✓ 已生成: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('✗ 处理ICNS失败:', error.message);
    return false;
  }
}

/**
 * 处理所有图标格式
 */
async function processAllIcons() {
  console.log('\n📸 开始处理所有图标格式...');
  
  // 首先提取中心logo
  const tempLogoPath = await extractCenterLogo();
  if (!tempLogoPath) {
    return false;
  }
  
  let totalSuccess = 0;
  let totalCount = 0;
  
  try {
    // 处理PNG图标
    console.log('\n📸 处理PNG图标...');
    const pngSpecs = iconSpecs.filter(spec => spec.format === 'png');
    let pngSuccessCount = 0;
    
    for (const spec of pngSpecs) {
      const success = await processPngIcon(spec, tempLogoPath);
      if (success) pngSuccessCount++;
    }
    
    totalSuccess += pngSuccessCount;
    totalCount += pngSpecs.length;
    console.log(`✅ PNG处理完成: ${pngSuccessCount}/${pngSpecs.length} 个图标生成成功`);
    
    // 处理ICO图标
    console.log('\n🪟 处理Windows ICO图标...');
    const icoSuccess = await processIcoIcon(tempLogoPath);
    if (icoSuccess) totalSuccess++;
    totalCount++;
    
    // 处理ICNS图标
    console.log('\n🍎 处理macOS ICNS图标...');
    const icnsSuccess = await processIcnsIcon(tempLogoPath);
    if (icnsSuccess) totalSuccess++;
    totalCount++;
    
  } finally {
    // 清理临时文件
    await cleanupTempFiles(tempLogoPath);
  }
  
  console.log(`\n🎯 总体处理结果: ${totalSuccess}/${totalCount} 个图标生成成功`);
  return totalSuccess === totalCount;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始图标生成流程...\n');
  
  // 验证源文件
  const sourceValid = await validateSourceFile();
  if (!sourceValid) {
    process.exit(1);
  }
  
  // 确保输出目录存在
  const outputReady = await ensureOutputDirectory();
  if (!outputReady) {
    process.exit(1);
  }
  
  // 获取源图像信息
  const imageInfo = await getSourceImageInfo();
  if (!imageInfo) {
    process.exit(1);
  }
  
  // 提取并保存颜色配置
  console.log('\n🎨 分析logo颜色...');
  const colorPalette = await extractColorPalette();
  if (!colorPalette) {
    console.error('❌ 颜色分析失败');
    process.exit(1);
  }
  
  console.log('\n📋 配置信息:');
  console.log('源文件:', config.sourceFile);
  console.log('输出目录:', config.outputDirectory);
  console.log('图标规格:', iconSpecs.length, '个');
  console.log('颜色配置: src/assets/color-palette.json');
  
  // 处理所有图标格式
  const allIconsSuccess = await processAllIcons();
  if (!allIconsSuccess) {
    console.error('❌ 图标处理失败');
    process.exit(1);
  }
  
  console.log('\n🎉 图标处理脚本执行完成!');
  console.log('📁 生成的文件:');
  console.log('  - PNG图标: src-tauri/icons/ (32x32, 128x128, 128x128@2x, icon.png)');
  console.log('  - Windows ICO: src-tauri/icons/icon.ico');
  console.log('  - macOS ICNS: src-tauri/icons/icon.icns');
  console.log('  - 颜色配置: src/assets/color-palette.json');
}

// 运行主函数
main().catch(error => {
  console.error('❌ 设置过程中发生错误:', error.message);
  process.exit(1);
});