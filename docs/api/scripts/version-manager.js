#!/usr/bin/env node

/**
 * API版本管理工具
 * 
 * 功能:
 * 1. 创建新版本
 * 2. 列出所有版本
 * 3. 比较版本差异
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const versionsDir = join(rootDir, 'versions');

/**
 * 创建新版本
 */
function createVersion(version) {
  const versionDir = join(versionsDir, `v${version}`);
  
  // 检查版本是否已存在
  if (existsSync(versionDir)) {
    console.error(`❌ 版本 v${version} 已存在`);
    process.exit(1);
  }
  
  console.log(`📦 创建版本 v${version}...\n`);
  
  // 创建版本目录
  mkdirSync(versionDir, { recursive: true });
  console.log(`✅ 创建目录: ${versionDir}`);
  
  // 复制当前OpenAPI规范
  const sourceFile = join(rootDir, 'openapi.yaml');
  const targetFile = join(versionDir, 'openapi.yaml');
  
  if (existsSync(sourceFile)) {
    copyFileSync(sourceFile, targetFile);
    console.log(`✅ 复制规范文件: openapi.yaml`);
  } else {
    console.error(`❌ 源文件不存在: ${sourceFile}`);
    process.exit(1);
  }
  
  // 创建变更日志
  const changelogFile = join(versionDir, 'CHANGELOG.md');
  const changelogContent = `# API 变更日志

## v${version} (${new Date().toISOString().split('T')[0]})

### 新增功能

- ✨ 

### 改进

- 🔧 

### 修复

- 🐛 

### 破坏性变更

- ⚠️ 

### 废弃

- 🗑️ 
`;
  
  writeFileSync(changelogFile, changelogContent);
  console.log(`✅ 创建变更日志: CHANGELOG.md`);
  
  // 创建迁移指南（如果是主版本）
  const [major] = version.split('.');
  const prevMajor = parseInt(major) - 1;
  
  if (major !== '0' && prevMajor >= 0) {
    const migrationFile = join(versionDir, 'MIGRATION.md');
    const migrationContent = `# 从 v${prevMajor}.x 迁移到 v${version}

## 破坏性变更

### 1. 变更标题

**v${prevMajor}.x:**
\`\`\`json
{
  "old": "format"
}
\`\`\`

**v${version}:**
\`\`\`json
{
  "new": "format"
}
\`\`\`

**迁移步骤:**
1. 步骤1
2. 步骤2

## 新增功能

- 功能1
- 功能2

## 兼容性

说明兼容性情况。
`;
    
    writeFileSync(migrationFile, migrationContent);
    console.log(`✅ 创建迁移指南: MIGRATION.md`);
  }
  
  console.log(`\n🎉 版本 v${version} 创建成功！`);
  console.log(`\n📝 下一步:`);
  console.log(`   1. 编辑 ${changelogFile}`);
  console.log(`   2. 更新 docs/api/openapi.yaml 中的版本号`);
  console.log(`   3. 提交变更: git add . && git commit -m "chore: release v${version}"`);
  console.log(`   4. 创建标签: git tag -a v${version} -m "Release v${version}"`);
}

/**
 * 列出所有版本
 */
function listVersions() {
  if (!existsSync(versionsDir)) {
    console.log('📦 暂无版本');
    return;
  }
  
  const versions = readdirSync(versionsDir)
    .filter(dir => dir.startsWith('v'))
    .sort((a, b) => {
      const versionA = a.substring(1).split('.').map(Number);
      const versionB = b.substring(1).split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        if (versionA[i] !== versionB[i]) {
          return versionB[i] - versionA[i];
        }
      }
      return 0;
    });
  
  console.log('📦 已发布的版本:\n');
  
  versions.forEach((version, index) => {
    const versionDir = join(versionsDir, version);
    const changelogFile = join(versionDir, 'CHANGELOG.md');
    
    let releaseDate = 'Unknown';
    if (existsSync(changelogFile)) {
      const content = readFileSync(changelogFile, 'utf-8');
      const match = content.match(/\((\d{4}-\d{2}-\d{2})\)/);
      if (match) {
        releaseDate = match[1];
      }
    }
    
    const status = index === 0 ? '✅ 当前版本' : '📋 历史版本';
    console.log(`${status} ${version} (${releaseDate})`);
  });
}

/**
 * 比较版本差异
 */
function compareVersions(version1, version2) {
  const file1 = join(versionsDir, `v${version1}`, 'openapi.yaml');
  const file2 = join(versionsDir, `v${version2}`, 'openapi.yaml');
  
  if (!existsSync(file1)) {
    console.error(`❌ 版本 v${version1} 不存在`);
    process.exit(1);
  }
  
  if (!existsSync(file2)) {
    console.error(`❌ 版本 v${version2} 不存在`);
    process.exit(1);
  }
  
  console.log(`🔍 比较版本 v${version1} 和 v${version2}...\n`);
  
  try {
    // 使用git diff比较
    execSync(`git diff --no-index "${file1}" "${file2}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    // git diff在有差异时会返回非0退出码，这是正常的
    if (error.status !== 1) {
      console.error('❌ 比较失败');
      process.exit(1);
    }
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      if (args.length < 2) {
        console.log('使用方法: node version-manager.js create <version>');
        console.log('示例: node version-manager.js create 1.1.0');
        process.exit(1);
      }
      createVersion(args[1]);
      break;
      
    case 'list':
      listVersions();
      break;
      
    case 'compare':
      if (args.length < 3) {
        console.log('使用方法: node version-manager.js compare <version1> <version2>');
        console.log('示例: node version-manager.js compare 1.0.0 1.1.0');
        process.exit(1);
      }
      compareVersions(args[1], args[2]);
      break;
      
    default:
      console.log('API版本管理工具\n');
      console.log('使用方法:');
      console.log('  node version-manager.js create <version>   - 创建新版本');
      console.log('  node version-manager.js list               - 列出所有版本');
      console.log('  node version-manager.js compare <v1> <v2>  - 比较版本差异');
      console.log('\n示例:');
      console.log('  node version-manager.js create 1.1.0');
      console.log('  node version-manager.js list');
      console.log('  node version-manager.js compare 1.0.0 1.1.0');
  }
}

main();
