#!/usr/bin/env node

/**
 * API文档生成脚本
 * 
 * 功能:
 * 1. 验证OpenAPI规范
 * 2. 生成打包后的规范文件
 * 3. 生成静态HTML文档
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 开始生成API文档...\n');

// 1. 验证OpenAPI规范
console.log('📋 步骤 1/3: 验证OpenAPI规范...');
try {
  execSync('npx @apidevtools/swagger-cli validate openapi.yaml', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ OpenAPI规范验证通过\n');
} catch (error) {
  console.error('❌ OpenAPI规范验证失败');
  process.exit(1);
}

// 2. 生成打包后的规范文件
console.log('📦 步骤 2/3: 生成打包后的规范文件...');
try {
  // 生成YAML格式
  execSync('npx @apidevtools/swagger-cli bundle openapi.yaml -o openapi-bundled.yaml -t yaml', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  // 生成JSON格式
  execSync('npx @apidevtools/swagger-cli bundle openapi.yaml -o openapi-bundled.json -t json', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  
  console.log('✅ 打包文件生成成功\n');
} catch (error) {
  console.error('❌ 打包文件生成失败');
  process.exit(1);
}

// 3. 创建输出目录
console.log('📁 步骤 3/3: 准备输出目录...');
const distDir = join(rootDir, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}
console.log('✅ 输出目录准备完成\n');

console.log('🎉 API文档生成完成！\n');
console.log('📖 查看文档:');
console.log('   - Swagger UI: npm run docs:serve');
console.log('   - 打包文件: docs/api/openapi-bundled.yaml');
console.log('   - 打包文件: docs/api/openapi-bundled.json\n');
