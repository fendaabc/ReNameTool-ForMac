#!/usr/bin/env node

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// 图标规格配置 - 只处理PNG格式
const iconSpecs = [
  { size: 32, outputPath: "src-tauri/icons/32x32.png" },
  { size: 128, outputPath: "src-tauri/icons/128x128.png" },
  { size: 256, outputPath: "src-tauri/icons/128x128@2x.png" }, // 2x版本
  { size: 512, outputPath: "src-tauri/icons/icon.png" }, // 基础图标
];

// 处理配置
const config = {
  sourceFile: "src/assets/1.png",
  outputDirectory: "src-tauri/icons",
};

/**
 * 验证源文件是否存在
 */
async function validateSourceFile() {
  try {
    await fs.access(config.sourceFile);
    console.log("✓ 源文件验证通过:", config.sourceFile);
    return true;
  } catch (error) {
    console.error("✗ 源文件不存在:", config.sourceFile);
    return false;
  }
}

/**
 * 确保输出目录存在
 */
async function ensureOutputDirectory() {
  try {
    await fs.mkdir(config.outputDirectory, { recursive: true });
    console.log("✓ 输出目录已准备:", config.outputDirectory);
    return true;
  } catch (error) {
    console.error("✗ 无法创建输出目录:", error.message);
    return false;
  }
}

/**
 * 创建macOS风格的圆角遮罩
 */
async function createMacOSRoundedMask(size) {
  // macOS图标圆角半径，调整到更自然的弧度
  const cornerRadius = Math.round(size * 0.45); // 调整圆角半径到45%，更自然的弧度

  // 创建圆角矩形SVG
  const roundedRectSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
    </svg>
  `;

  return Buffer.from(roundedRectSvg);
}

/**
 * 处理PNG图标
 */
async function processPngIcon(spec) {
  try {
    console.log(`🔄 处理 ${spec.size}x${spec.size} PNG (macOS圆角风格)...`);

    // 读取源图像
    let image = sharp(config.sourceFile);

    // 获取源图像信息
    const metadata = await image.metadata();
    console.log(`   源图像: ${metadata.width}x${metadata.height}`);

    // 调整到目标尺寸，保持宽高比，符合macOS图标标准比例
    const contentSize = Math.round(spec.size * 0.78); // 内容占78%，稍微增大内容区域
    image = image.resize(contentSize, contentSize, {
      kernel: sharp.kernel.lanczos3,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    // 创建最终尺寸的画布，将内容居中
    const padding = Math.round((spec.size - contentSize) / 2);
    image = image.extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    // 创建macOS风格的圆角遮罩
    const maskSvg = await createMacOSRoundedMask(spec.size);

    // 应用圆角遮罩
    image = image.composite([
      {
        input: maskSvg,
        blend: "dest-in",
      },
    ]);

    // 确保图像有alpha通道（RGBA格式）
    image = image.ensureAlpha();

    // 确保输出目录存在
    const outputDir = path.dirname(spec.outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // 保存PNG文件，确保RGBA格式
    await image
      .png({
        quality: 100,
        compressionLevel: 6,
        palette: false, // 确保不使用调色板，保持RGBA
      })
      .toFile(spec.outputPath);

    console.log(
      `✓ 已生成: ${spec.outputPath} (圆角半径: ${Math.round(
        spec.size * 0.45
      )}px)`
    );
    return true;
  } catch (error) {
    console.error(`✗ 处理PNG失败 (${spec.size}x${spec.size}):`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始PNG图标生成流程...\n");

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

  console.log("\n📋 配置信息:");
  console.log("源文件:", config.sourceFile);
  console.log("输出目录:", config.outputDirectory);
  console.log("图标规格:", iconSpecs.length, "个PNG图标");

  // 处理所有PNG图标
  console.log("\n📸 开始处理PNG图标...");
  let successCount = 0;

  for (const spec of iconSpecs) {
    const success = await processPngIcon(spec);
    if (success) successCount++;
  }

  console.log(
    `\n✅ PNG处理完成: ${successCount}/${iconSpecs.length} 个图标生成成功`
  );

  if (successCount === iconSpecs.length) {
    console.log("\n🎉 图标处理脚本执行完成!");
    console.log("📁 生成的文件:");
    console.log(
      "  - PNG图标: src-tauri/icons/ (32x32, 128x128, 128x128@2x, icon.png)"
    );
    console.log("\n📝 说明:");
    console.log("  - PNG格式图标已足够满足Tauri应用的跨平台需求");
  } else {
    console.error("❌ 部分图标生成失败");
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("❌ 图标生成过程中发生错误:", error.message);
  process.exit(1);
});
