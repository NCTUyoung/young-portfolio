import { describe, it, expect } from 'vitest'
import {
  isValidImageFile,
  isValidFileSize,
  isImageMimeType,
  validateFile,
  validateEventName,
  validateEventDescription,
  validateEmail,
  validateDateString,
  validateImageTitle,
  validateImageTags,
  isEmpty,
  isInRange,
  isValidLength
} from './validators'

describe('validators', () => {
  describe('files', () => {
    it('isValidImageFile checks extension', () => {
      expect(isValidImageFile('photo.JPG')).toBe(true)
      expect(isValidImageFile('doc.pdf')).toBe(false)
    })

    it('isValidFileSize respects MAX', () => {
      expect(isValidFileSize(1024)).toBe(true)
      expect(isValidFileSize(20 * 1024 * 1024)).toBe(false)
    })

    it('isImageMimeType', () => {
      expect(isImageMimeType('image/jpeg')).toBe(true)
      expect(isImageMimeType('text/plain')).toBe(false)
    })

    it('validateFile returns errors for invalid input', () => {
      const bad = new File(['x'], 'x.txt', { type: 'text/plain' })
      const r = validateFile(bad)
      expect(r.valid).toBe(false)
      expect(r.errors.length).toBeGreaterThan(0)
    })

    it('validateFile accepts small jpg', () => {
      const buf = new Uint8Array(100)
      const f = new File([buf], 'test.jpg', { type: 'image/jpeg' })
      const r = validateFile(f)
      expect(r.valid).toBe(true)
    })
  })

  describe('events', () => {
    it('validateEventName', () => {
      expect(validateEventName('').valid).toBe(false)
      expect(validateEventName('x').valid).toBe(false)
      expect(validateEventName('OK').valid).toBe(true)
      expect(validateEventName('春日街拍').valid).toBe(true)
    })

    it('validateEventDescription length', () => {
      expect(validateEventDescription('a'.repeat(201)).valid).toBe(false)
      expect(validateEventDescription('ok').valid).toBe(true)
    })
  })

  describe('image meta', () => {
    it('validateImageTitle', () => {
      expect(validateImageTitle('').valid).toBe(false)
      expect(validateImageTitle('Title').valid).toBe(true)
    })

    it('validateImageTags', () => {
      expect(validateImageTags(['a', 'b']).valid).toBe(true)
      expect(validateImageTags(Array(11).fill('x')).valid).toBe(false)
    })
  })

  describe('forms', () => {
    it('validateEmail', () => {
      expect(validateEmail('bad').valid).toBe(false)
      expect(validateEmail('a@b.co').valid).toBe(true)
    })

    it('validateDateString', () => {
      expect(validateDateString('2024-01-15').valid).toBe(true)
      expect(validateDateString('01-15-2024').valid).toBe(false)
    })
  })

  describe('generic', () => {
    it('isEmpty', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty('  ')).toBe(true)
      expect(isEmpty('a')).toBe(false)
    })

    it('isInRange', () => {
      expect(isInRange(5, 1, 10)).toBe(true)
      expect(isInRange(0, 1, 10)).toBe(false)
    })

    it('isValidLength', () => {
      expect(isValidLength('ab', 1, 5)).toBe(true)
      expect(isValidLength('', 1, 5)).toBe(false)
    })
  })
})
