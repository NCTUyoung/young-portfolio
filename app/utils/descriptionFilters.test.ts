import { describe, it, expect } from 'vitest'
import { isBoilerplateContent, nonBoilerplateOrEmpty } from './descriptionFilters'

describe('isBoilerplateContent', () => {
  it('flags empty / whitespace / null as boilerplate', () => {
    expect(isBoilerplateContent(null)).toBe(true)
    expect(isBoilerplateContent(undefined)).toBe(true)
    expect(isBoilerplateContent('')).toBe(true)
    expect(isBoilerplateContent('   ')).toBe(true)
  })

  it('flags exact-match template sentences as boilerplate', () => {
    expect(isBoilerplateContent('數位單眼相機拍攝作品')).toBe(true)
    expect(isBoilerplateContent('攝影作品')).toBe(true)
    expect(isBoilerplateContent('untitled')).toBe(true)
  })

  it('does not flag real descriptions as boilerplate', () => {
    expect(isBoilerplateContent('巨大的第一鳥居框住拜殿與白色幕布。')).toBe(false)
    expect(isBoilerplateContent('神奈川衝浪圖')).toBe(false)
  })

  it('preserves user content that merely mentions a template word', () => {
    expect(isBoilerplateContent('用數位單眼相機拍攝作品的實驗與心得。')).toBe(false)
  })
})

describe('nonBoilerplateOrEmpty', () => {
  it('returns empty string for boilerplate', () => {
    expect(nonBoilerplateOrEmpty('數位單眼相機拍攝作品')).toBe('')
    expect(nonBoilerplateOrEmpty(null)).toBe('')
  })

  it('returns trimmed content for non-boilerplate', () => {
    expect(nonBoilerplateOrEmpty('  真實描述  ')).toBe('真實描述')
  })
})
