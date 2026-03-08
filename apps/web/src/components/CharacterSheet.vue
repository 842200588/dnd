<template>
  <aside class="character-panel">
    <div class="sheet-crest">
      <p class="eyebrow">角色卡</p>
      <h2>{{ character.name }}</h2>
      <p class="sheet-subtitle">{{ character.race }} / {{ character.className }} / {{ character.level }} 级冒险者</p>
    </div>

    <div class="stats-strip">
      <div class="stat-pill">
        <span>生命值</span>
        <strong>{{ character.currentHp }}/{{ character.maxHp }}</strong>
        <!-- HP 进度条：高血量绿色，中血量黄色，低血量红色 -->
        <div class="hp-bar-track">
          <div class="hp-bar-fill" :style="{ width: hpPercent + '%', background: hpColor }" />
        </div>
      </div>
      <div class="stat-pill">
        <span>护甲等级</span>
        <strong>{{ character.armorClass }}</strong>
      </div>
      <div class="stat-pill">
        <span>金币</span>
        <strong>{{ character.goldAmount }}</strong>
      </div>
    </div>

    <section class="panel-section">
      <div class="section-head">
        <h3>能力值</h3>
        <!-- <span class="muted">以后端真实数据为准</span> -->
      </div>
      <div class="ability-grid">
        <div v-for="(value, key) in character.stats" :key="key" class="ability-card">
          <span>{{ labels[key] ?? key }}</span>
          <strong>{{ value }}</strong>
          <em>{{ formatModifier(value) }}</em>
        </div>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-head compact-head">
        <div>
          <h3>技能</h3>
        </div>
        <el-button v-if="skillLabels.length > 3" text type="warning" @click="skillsOpen = true">更多</el-button>
      </div>
      <div v-if="skillPreview.length" class="sheet-chip-grid">
        <div v-for="skill in skillPreview" :key="skill" class="sheet-chip">{{ skill }}</div>
      </div>
      <p v-else class="sheet-empty">当前角色暂无技能熟练数据</p>
    </section>

    <section class="panel-section">
      <div class="section-head compact-head">
        <div>
          <h3>装备</h3>
        </div>
        <el-button v-if="character.inventory.length > 3" text type="warning" @click="inventoryOpen = true">更多</el-button>
      </div>
      <ul v-if="inventoryPreview.length" class="inventory-list compact-inventory visible-inventory">
        <li v-for="item in inventoryPreview" :key="item.name">
          <span>{{ item.name }}</span>
          <strong>x{{ item.quantity }}</strong>
        </li>
      </ul>
      <p v-else class="sheet-empty">当前角色暂无装备数据</p>
    </section>

    <section class="panel-section">
      <div class="section-head compact-head">
        <div>
          <h3>场上人物</h3>
          <span class="muted">NPC 与怪物状态由后端实时返回</span>
        </div>
      </div>
      <div v-if="npcs.length" class="npc-stack">
        <article v-for="npc in npcs" :key="npc.id" class="npc-card">
          <div class="section-head compact-head">
            <div>
              <strong class="npc-name">{{ npc.name }}</strong>
              <p class="npc-meta">{{ npc.creatureType || 'NPC' }}<span v-if="npc.race"> / {{ npc.race }}</span><span v-if="npc.className"> / {{ npc.className }}</span></p>
            </div>
            <span class="npc-attitude">{{ npc.attitude }} / 好感 {{ npc.affinity }}</span>
          </div>
          <div class="stats-strip npc-strip">
            <div class="stat-pill">
              <span>生命值</span>
              <strong>{{ npc.currentHp }}/{{ npc.maxHp }}</strong>
            </div>
            <div class="stat-pill">
              <span>护甲等级</span>
              <strong>{{ npc.armorClass }}</strong>
            </div>
            <div class="stat-pill">
              <span>等级</span>
              <strong>{{ npc.level }}</strong>
            </div>
          </div>
          <div v-if="npc.statuses.length" class="status-strip">
            <span
              v-for="status in npc.statuses"
              :key="`${npc.id}-${status.name}`"
              class="status-badge"
              :style="{ '--status-color': status.color }"
            >
              {{ status.name }}
            </span>
          </div>
        </article>
      </div>
      <p v-else class="sheet-empty">当前场景还没有已记录的 NPC 或怪物</p>
    </section>

    <el-dialog v-model="skillsOpen" width="560px" title="全部技能熟练">
      <div class="sheet-chip-grid expanded-grid">
        <div v-for="skill in skillLabels" :key="skill" class="sheet-chip">{{ skill }}</div>
      </div>
    </el-dialog>

    <el-dialog v-model="inventoryOpen" width="560px" title="全部装备">
      <ul class="inventory-list visible-inventory">
        <li v-for="item in character.inventory" :key="item.name">
          <span>{{ item.name }}</span>
          <strong>x{{ item.quantity }}</strong>
        </li>
      </ul>
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getAbilityModifier, getSkillLabel, ABILITY_LABELS } from '@/lib/dnd'
import type { NpcGameState } from '@/lib/api'

const props = defineProps<{
  character: {
    name: string
    race: string
    className: string
    level: number
    maxHp: number
    currentHp: number
    armorClass: number
    goldAmount: number
    stats: Record<string, number>
    skills: string[]
    inventory: Array<{ name: string; quantity: number }>
  }
  npcs: NpcGameState[]
}>()

/** 从 lib/dnd 复用，不再本地重复定义 */
const labels = ABILITY_LABELS

const skillsOpen = ref(false)
const inventoryOpen = ref(false)

/** HP 百分比，用于进度条宽度 */
const hpPercent = computed(() =>
  props.character.maxHp > 0
    ? Math.round((props.character.currentHp / props.character.maxHp) * 100)
    : 0,
)

/** HP 进度条颜色：>50% 绿色，>25% 黄色，否则红色 */
const hpColor = computed(() => {
  if (hpPercent.value > 50) return '#5cb85c'
  if (hpPercent.value > 25) return '#f7c65c'
  return '#f38b7b'
})

const skillLabels = computed(() => props.character.skills.map((skill) => getSkillLabel(skill)))
const skillPreview = computed(() => skillLabels.value.slice(0, 3))
const inventoryPreview = computed(() => props.character.inventory.slice(0, 3))

function formatModifier(score: number) {
  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : String(modifier)
}
</script>
