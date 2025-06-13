#!/usr/bin/env node

/**
 * GitHub Pages 部署腳本
 * 使用方法: node scripts/deploy-github.js
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 開始部署到 GitHub Pages...')

try {
  // 1. 清理並建置
  console.log('📦 正在生成靜態檔案...')
  execSync('npm run generate', { stdio: 'inherit' })

  // 2. 進入 dist 目錄
  const distPath = path.join(process.cwd(), '.output/public')

  if (!fs.existsSync(distPath)) {
    throw new Error('找不到 .output/public 目錄，請確認建置是否成功')
  }

  console.log('📁 進入輸出目錄...')
  process.chdir(distPath)

  // 3. 初始化 git（如果需要）
  try {
    execSync('git status', { stdio: 'ignore' })
  } catch {
    console.log('🔧 初始化 Git 倉庫...')
    execSync('git init', { stdio: 'inherit' })
  }

  // 4. 添加所有檔案
  console.log('📝 添加檔案到 Git...')
  execSync('git add .', { stdio: 'inherit' })

  // 5. 提交變更
  console.log('💾 提交變更...')
  const commitMessage = `Deploy: ${new Date().toISOString()}`
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })

  // 6. 推送到 gh-pages 分支
  console.log('🚀 推送到 gh-pages 分支...')
  execSync('git branch -M gh-pages', { stdio: 'inherit' })

  // 注意：需要設定 origin remote
  // execSync('git remote add origin https://github.com/用戶名/倉庫名.git', { stdio: 'inherit' })
  // execSync('git push -u origin gh-pages --force', { stdio: 'inherit' })

  console.log('✅ 部署完成！')
  console.log('💡 提示：請確保已設定 GitHub Pages 使用 gh-pages 分支')

} catch (error) {
  console.error('❌ 部署失敗:', error.message)
  process.exit(1)
}