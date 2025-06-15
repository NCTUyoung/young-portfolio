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
  execSync('npx nuxt build --preset github-pages', { stdio: 'inherit' })

  // 2. 進入 dist 目錄
  const distPath = path.join(process.cwd(), '.output/public')

  if (!fs.existsSync(distPath)) {
    throw new Error('找不到 .output/public 目錄，請確認建置是否成功')
  }

  console.log('📁 進入輸出目錄...')
  process.chdir(distPath)

  // 3. 初始化新的 git 倉庫（強制重新初始化以避免 .gitignore 問題）
  console.log('🔧 初始化 Git 倉庫...')
  execSync('git init --initial-branch=gh-pages', { stdio: 'inherit' })

  // 4. 添加所有檔案（在新的 git 倉庫中不會受到上層 .gitignore 影響）
  console.log('📝 添加檔案到 Git...')
  execSync('git add .', { stdio: 'inherit' })

  // 5. 提交變更
  console.log('💾 提交變更...')
  const commitMessage = `Deploy: ${new Date().toISOString()}`
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })

  // 6. 推送到 gh-pages 分支
  console.log('🚀 推送到 gh-pages 分支...')

  // 設定 origin remote 並推送
  try {
    execSync('git remote add origin https://github.com/NCTUyoung/young-portfolio.git', { stdio: 'ignore' })
  } catch {
    // remote 已存在，忽略錯誤
  }
  execSync('git push -u origin gh-pages --force', { stdio: 'inherit' })

  console.log('✅ 部署完成！')
  console.log('💡 提示：請確保已設定 GitHub Pages 使用 gh-pages 分支')

} catch (error) {
  console.error('❌ 部署失敗:', error.message)
  process.exit(1)
}