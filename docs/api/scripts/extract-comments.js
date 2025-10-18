#!/usr/bin/env node

/**
 * 代码注释提取工具
 * 
 * 从源代码中提取JSDoc/TSDoc注释，生成API文档
 * 
 * 使用方法:
 * node extract-comments.js <source-dir> <output-file>
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * 提取文件中的JSDoc注释
 */
function extractJSDoc(content) {
  const jsdocRegex = /\/\*\*\s*\n([^*]|\*(?!\/))*\*\//g;
  const matches = content.match(jsdocRegex);
  
  if (!matches) return [];
  
  return matches.map(match => {
    // 解析JSDoc标签
    const tags = {};
    const lines = match.split('\n');
    
    lines.forEach(line => {
      const tagMatch = line.match(/@(\w+)\s+(.+)/);
      if (tagMatch) {
        const [, tagName, tagValue] = tagMatch;
        if (!tags[tagName]) {
          tags[tagName] = [];
        }
        tags[tagName].push(tagValue.trim());
      }
    });
    
    return {
      raw: match,
      tags
    };
  });
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir, extensions = ['.ts', '.js', '.vue']) {
  const files = [];
  
  function scan(currentDir) {
    const items = readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和dist目录
        if (item !== 'node_modules' && item !== 'dist') {
          scan(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = extname(fullPath);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }
  
  scan(dir);
  return files;
}

/**
 * 提取API路由信息
 */
function extractAPIRoutes(docs) {
  const routes = [];
  
  docs.forEach(doc => {
    if (doc.tags.route) {
      const route = doc.tags.route[0];
      const [method, path] = route.split(' ');
      
      routes.push({
        method: method.toUpperCase(),
        path,
        summary: doc.tags.summary?.[0] || '',
        description: doc.tags.description?.[0] || '',
        params: doc.tags.param || [],
        returns: doc.tags.returns?.[0] || '',
        throws: doc.tags.throws || []
      });
    }
  });
  
  return routes;
}

/**
 * 生成OpenAPI规范
 */
function generateOpenAPISpec(routes) {
  const paths = {};
  
  routes.forEach(route => {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }
    
    const operation = {
      summary: route.summary,
      description: route.description,
      responses: {
        '200': {
          description: route.returns || 'Success'
        }
      }
    };
    
    // 添加参数
    if (route.params.length > 0) {
      operation.parameters = route.params.map(param => {
        const [type, name, ...desc] = param.split(/\s+/);
        return {
          name: name.replace(/[{}]/g, ''),
          in: 'query',
          description: desc.join(' '),
          schema: { type: type.replace(/[{}]/g, '') }
        };
      });
    }
    
    // 添加错误响应
    route.throws.forEach(error => {
      const [code, ...message] = error.split(/\s+/);
      operation.responses[code.replace(/[{}]/g, '')] = {
        description: message.join(' ')
      };
    });
    
    paths[route.path][route.method.toLowerCase()] = operation;
  });
  
  return {
    openapi: '3.0.3',
    info: {
      title: 'Generated API Documentation',
      version: '1.0.0'
    },
    paths
  };
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node extract-comments.js <source-dir> <output-file>');
    process.exit(1);
  }
  
  const [sourceDir, outputFile] = args;
  
  console.log(`📂 扫描目录: ${sourceDir}`);
  const files = scanDirectory(sourceDir);
  console.log(`📄 找到 ${files.length} 个文件\n`);
  
  const allDocs = [];
  
  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const docs = extractJSDoc(content);
    
    if (docs.length > 0) {
      console.log(`📝 ${file}: 找到 ${docs.length} 个注释`);
      allDocs.push(...docs);
    }
  });
  
  console.log(`\n✅ 总共提取 ${allDocs.length} 个注释\n`);
  
  // 提取API路由
  const routes = extractAPIRoutes(allDocs);
  console.log(`🔗 找到 ${routes.length} 个API路由\n`);
  
  // 生成OpenAPI规范
  if (routes.length > 0) {
    const spec = generateOpenAPISpec(routes);
    writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log(`💾 已保存到: ${outputFile}\n`);
  } else {
    console.log('⚠️  未找到API路由定义\n');
  }
}

main();
