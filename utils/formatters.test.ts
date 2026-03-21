import { describe, it, expect } from 'vitest'
import {
  formatDateShort,
  formatDateFull,
  formatDateKey,
  formatShutterSpeed,
  formatCameraName,
  formatFileSize,
  formatAperture,
  formatFocalLength,
  formatISO,
  truncateText,
  capitalize,
  kebabCase
} from './formatters'

describe('formatters', () => {
  describe('formatDateShort', () => {
    it('formats MM/DD', () => {
      expect(formatDateShort(new Date(2024, 2, 5))).toBe('03/05')
    })
  })

  describe('formatDateFull', () => {
    it('formats YYYY Mon DD from Date', () => {
      expect(formatDateFull(new Date(2024, 10, 8))).toBe('2024 Nov 08')
    })
  })

  describe('formatDateKey', () => {
    it('formats YYYY-MM-DD', () => {
      expect(formatDateKey(new Date(2024, 0, 9))).toBe('2024-01-09')
    })
  })

  describe('formatShutterSpeed', () => {
    it('uses seconds when >= threshold', () => {
      expect(formatShutterSpeed(1)).toBe('1s')
      expect(formatShutterSpeed(2)).toBe('2s')
    })

    it('uses fraction when < 1s', () => {
      expect(formatShutterSpeed(0.5)).toBe('1/2s')
      expect(formatShutterSpeed(1 / 125)).toMatch(/^1\/125/)
    })
  })

  describe('formatCameraName', () => {
    it('maps NIKON CORPORATION to model', () => {
      expect(formatCameraName('NIKON CORPORATION', 'Z6')).toBe('Z6')
    })

    it('joins generic camera and model', () => {
      expect(formatCameraName('Canon', 'R5')).toBe('Canon R5')
    })
  })

  describe('formatFileSize', () => {
    it('handles zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('shows KB for small files', () => {
      expect(formatFileSize(1024)).toContain('KB')
    })
  })

  describe('photo helpers', () => {
    it('formatAperture', () => {
      expect(formatAperture(2.8)).toBe('f/2.8')
    })

    it('formatFocalLength', () => {
      expect(formatFocalLength(50)).toBe('50mm')
    })

    it('formatISO', () => {
      expect(formatISO(400)).toBe('ISO 400')
    })
  })

  describe('text', () => {
    it('truncateText adds ellipsis', () => {
      expect(truncateText('hello world', 8)).toBe('hello...')
    })

    it('capitalize', () => {
      expect(capitalize('foo')).toBe('Foo')
    })

    it('kebabCase splits camelCase', () => {
      expect(kebabCase('fooBar')).toBe('foo-bar')
    })
  })
})
