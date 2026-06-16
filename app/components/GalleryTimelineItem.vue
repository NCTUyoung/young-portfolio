<template>
  <!--
    R10：wide 模式（影世界膠卷流專用）——把原本竊取 ~160px 寬的縱書き時間側欄
    改成「橫向章首帶」(time-band)，內容區因此吃滿主欄全寬（896px），
    讓單欄全寬膠卷真正落地，消除 critic 連兩輪點名的右側巨幅死白。
    非 wide（保留舊行為）仍走左右交替的縱書き timeline 側欄。
  -->
  <div v-if="wide" class="film-tl">
    <!-- 橫向章首帶：左 sprocket-node + 時間讀數 + 事件描述/地點，hairline 收尾 -->
    <div class="film-tl__band">
      <span class="film-tl__node" aria-hidden="true">
        <span class="film-tl__node-diamond"/>
      </span>
      <span class="film-tl__time font-jp">{{ timeLabel }}</span>
      <span
        v-if="eventInfo && showEventInfo && (eventInfo.description || eventInfo.location)"
        class="film-tl__meta"
      >
        <span v-if="eventInfo.location" class="film-tl__loc">
          <span class="jp-sumi-dot !w-1 !h-1 flex-shrink-0" aria-hidden="true"/>{{ eventInfo.location }}
        </span>
      </span>
      <span class="film-tl__rule" aria-hidden="true"/>
      <button
        v-if="showEventControl"
        type="button"
        class="film-tl__toggle"
        :aria-expanded="isExpanded"
        :title="`${isExpanded ? '折疊' : '展開'} ${eventName} 的作品`"
        @click="eventKey && toggleGroupExpansion(eventKey)"
      >
        <span class="font-jp">{{ isExpanded ? '收' : '展' }}</span>
      </button>
    </div>

    <Transition name="collapse-fade" mode="out-in">
      <div v-if="shouldShowContent" class="film-tl__content collapse-from-left relative">
        <slot />
      </div>
      <div v-else-if="!shouldShowContent && showEventControl" class="film-tl__content chapter-fold relative">
        <slot name="cover" />
      </div>
    </Transition>
  </div>

  <div v-else class="flex items-start relative" :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'">
    <!-- Timeline Section -->
    <div
      class="md:w-40 flex-shrink-0 text-right md:text-left mb-4 md:mb-0 relative overflow-visible"
      :class="index % 2 === 0 ? 'md:mr-16' : 'md:ml-16 md:text-right'"
    >
      <!-- Timeline 節點 — 菱形日式設計（hairline + 墨點） -->
      <div
        class="absolute hidden md:block z-10"
        :class="index % 2 === 0 ? 'left-[-4.5rem]' : 'right-[-4.5rem]'"
        style="top: 0.2rem;"
      >
        <!-- 外框菱形 hairline -->
        <div class="w-4 h-4 border border-stone-400/60 dark:border-stone-500/60 rotate-45 relative">
          <!-- 內部墨點 -->
          <div class="absolute inset-[4px] bg-stone-700/70 dark:bg-stone-300/70 rotate-0"/>
        </div>
      </div>

      <!-- Event Control Button -->
      <div
        v-if="showEventControl"
        class="absolute hidden md:block z-20"
        :class="index % 2 === 0 ? 'left-[-3.2rem]' : 'right-[-3.2rem]'"
        style="top: 1.4rem;"
      >
        <button
          :class="[
            'w-5 h-5 rounded-full transition-colors duration-200 flex items-center justify-center group border',
            isExpanded
              ? 'bg-stone-100/90 dark:bg-stone-800/80 border-stone-300 dark:border-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700'
              : 'bg-stone-700/90 dark:bg-stone-200/90 border-stone-600 dark:border-stone-300 hover:bg-stone-800 dark:hover:bg-stone-100'
          ]"
          :title="`${isExpanded ? '折疊' : '展開'} ${eventName} 的作品`"
          @click="eventKey && toggleGroupExpansion(eventKey)"
        >
          <svg
            class="w-2.5 h-2.5 transition-colors duration-200"
            :class="isExpanded ? 'text-stone-500 dark:text-stone-400' : 'text-stone-50 dark:text-stone-900'"
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path
              v-if="isExpanded"
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
            <path
              v-else
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Time Label: -rotate-90 makes visual height ≈ horizontal text width; reserve min-height or glyphs clip -->
      <div
        class="text-sm text-stone-400 dark:text-stone-500 font-light tracking-wide mb-10 overflow-visible md:flex md:items-center md:justify-center md:min-h-[28ch]"
      >
        <span
          class="transform md:-rotate-90 md:origin-center whitespace-nowrap inline-block font-jp select-none leading-normal"
        >
          {{ timeLabel }}
        </span>
      </div>

      <!-- Event Info — 日式側線設計（去背景色塊，只留 hairline + 側線） -->
      <div
        v-if="eventInfo && showEventInfo && (eventInfo.description || eventInfo.location)"
        class="hidden md:block"
        :class="index % 2 === 0 ? '' : 'text-right'"
      >
        <div
          class="text-xs max-w-32"
          :class="[
            index % 2 === 0
              ? 'pl-3 text-left border-l border-stone-300/60 dark:border-stone-600/60'
              : 'pr-3 text-right border-r border-stone-300/60 dark:border-stone-600/60'
          ]"
        >
          <div v-if="eventInfo.description" class="text-stone-600 dark:text-stone-300 mb-1 truncate font-light tracking-wide">
            {{ eventInfo.description }}
          </div>
          <div
v-if="eventInfo.location" class="text-stone-400 dark:text-stone-500 truncate flex items-center gap-1"
               :class="index % 2 !== 0 ? 'justify-end' : ''">
            <!-- 墨點替代圖示 -->
            <span class="jp-sumi-dot !w-1 !h-1 flex-shrink-0" aria-hidden="true"/>
            <span>{{ eventInfo.location }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Slot — 日式過場：紙の展開 + 方向性滑入 + 側線 -->
    <Transition name="collapse-fade" mode="out-in">
      <div
        v-if="shouldShowContent"
        class="flex-1 min-w-0 relative"
        :class="[
          index % 2 === 0 ? 'md:ml-16' : 'md:mr-16',
          index % 2 === 0 ? 'collapse-from-left' : 'collapse-from-right'
        ]"
      >
        <!-- 側線裝飾 — 隨內容淡入，延遲出現 -->
        <div
          class="collapse-accent-line absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent-400/50 dark:via-accent-500/40 to-transparent"
          :class="index % 2 === 0 ? 'left-0' : 'right-0 left-auto'"
        />
        <slot />
      </div>
    </Transition>

    <!--
      R34：摺合狀態的「章封」cover slot — 取代 R33 純隱藏行為
      讓 user 看到「這裡有 N 葉作品 + caption」並能一鍵展開，不再是空白
    -->
    <Transition name="collapse-fade" mode="out-in">
      <div
        v-if="!shouldShowContent && showEventControl"
        class="flex-1 min-w-0 relative chapter-fold"
        :class="[index % 2 === 0 ? 'md:ml-16' : 'md:mr-16']"
      >
        <slot name="cover" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGalleryStore } from '~/stores/gallery'
import type { PhotoEvent } from '~~/shared/types/gallery'

interface Props {
  index: number
  timeLabel: string
  eventInfo?: PhotoEvent | null
  eventKey?: string
  showEventControl?: boolean
  showEventInfo?: boolean
  /** R33：若 true，user 未操作過時預設摺合（用於 timeline 較舊的 events 減負） */
  defaultCollapsed?: boolean
  /** R10：wide 模式 — 影世界膠卷流走橫向章首帶 + 全寬內容（消除側欄竊寬死白） */
  wide?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  eventInfo: null,
  eventKey: '',
  showEventControl: false,
  showEventInfo: false,
  defaultCollapsed: false,
  wide: false
})

const galleryStore = useGalleryStore()
const { expandedGroups } = storeToRefs(galleryStore)
const { toggleGroupExpansion } = galleryStore

const eventName = computed(() => props.eventInfo?.name || '事件')

// 預設展開行為：
//   - defaultCollapsed=false（前 N 個 events）：state 未設 → 展開
//   - defaultCollapsed=true（較舊 events）：state 未設 → 摺合
//   user 一旦點 toggle，明確 state 接管預設
const isExpanded = computed(() => {
  if (!props.eventKey) return true
  const state = expandedGroups.value[props.eventKey]
  if (state === undefined) return !props.defaultCollapsed
  return state
})

// 若沒有顯示控制按鈕，內容一律顯示
const shouldShowContent = computed(() => {
  return !props.showEventControl || isExpanded.value
})
</script>

<style scoped>
/* ===== R10：wide 模式（影世界膠卷流）橫向章首帶 + 全寬內容 ===== */
.film-tl { position: relative; }
.film-tl__band {
  display: flex;
  align-items: center;
  gap: 1rem;
  /* g2：band 下距由 1.6rem 收為 0.5rem——摺合章「時間帶 + 現像條」讀作單一章單元，
     不再每章撐開一段空距（下半冷調空白的次要來源）。展開時內容自帶 padding 氣口。 */
  margin-bottom: 0.5rem;
}
/* 章首節點：膠卷齒孔色的小菱形（serif 影世界調性，與繪 mono 標牌對立） */
.film-tl__node {
  flex-shrink: 0;
  width: 0.9rem;
  height: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.film-tl__node-diamond {
  width: 0.55rem;
  height: 0.55rem;
  transform: rotate(45deg);
  border: 1px solid color-mix(in srgb, var(--accent) 60%, var(--fg-muted));
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}
.film-tl__time {
  flex-shrink: 0;
  font-family: 'Noto Serif JP', 'Source Han Serif TC', serif;
  font-size: 0.92rem;
  font-weight: 300;
  letter-spacing: 0.22em;
  color: rgb(120 113 108);
  white-space: nowrap;
}
:global(.dark) .film-tl__time { color: rgb(168 162 158); }
.film-tl__meta { flex-shrink: 0; display: inline-flex; align-items: center; }
.film-tl__loc {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: rgb(168 162 158);
}
/* hairline 收尾：橫貫剩餘寬度，影世界的「顯影軌」 */
.film-tl__rule {
  flex: 1;
  height: 1px;
  min-width: 1.5rem;
  background: linear-gradient(to right,
    color-mix(in srgb, var(--accent) 28%, transparent),
    color-mix(in srgb, var(--accent) 10%, transparent) 60%,
    transparent);
}
.film-tl__toggle {
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  background: transparent;
  color: color-mix(in srgb, var(--accent) 80%, var(--fg-muted));
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}
.film-tl__toggle:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.film-tl__toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.film-tl__content { width: 100%; min-width: 0; }

/* 紙の展開 — 輕微 scale 如紙張落定 */
/* 方向性滑入 — 依時間軸左右，自軸心滑出 */
.collapse-fade-enter-active {
  transition: opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.collapse-fade-enter-active .collapse-accent-line {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.12s;
  opacity: 1;
}
.collapse-fade-leave-active {
  transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapse-fade-leave-active .collapse-accent-line {
  transition: opacity 0.15s ease-out;
  opacity: 0;
}
.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
}
.collapse-fade-enter-from.collapse-from-left,
.collapse-fade-leave-to.collapse-from-left {
  transform: translateX(-14px) translateY(-8px) scale(0.98);
}
.collapse-fade-enter-from.collapse-from-right,
.collapse-fade-leave-to.collapse-from-right {
  transform: translateX(14px) translateY(-8px) scale(0.98);
}
.collapse-fade-enter-to .collapse-accent-line,
.collapse-fade-leave-from .collapse-accent-line {
  opacity: 1;
}
.collapse-fade-enter-from .collapse-accent-line,
.collapse-fade-leave-to .collapse-accent-line {
  opacity: 0;
}
</style>
