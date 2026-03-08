<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElButton, ElCard, ElInput, ElMessage, ElOption, ElSelect, ElTag } from 'element-plus'
import { ABILITY_KEYS, ABILITY_LABELS, getClassRule, getRaceRule, getRules, getPointBuySpent, computeDerivedValues, computeFinalStats, getSkillLabel } from '@/lib/dnd'
import type { AbilityKey } from '@/lib/dnd'
import type { CharacterPayload } from '@/lib/dnd'

const emit = defineEmits<{ submit: [value: CharacterPayload] }>()

const text = {
  eyebrow: '建卡大厅',
  title: '按规则塑造你的冒险者',
  subtitle: '先选择种族与职业，再用 27 点购分配基础属性。系统会自动计算种族加值、初始生命值、护甲等级和技能限制。',
  badges: { pointBuy: '27 点购', validation: '自动校验', locked: '规则锁定' },
  identityTitle: '角色身份',
  identityHint: '选择而非自由输入',
  labels: { name: '角色姓名', class: '职业', race: '种族 / 亚种族', notes: '角色札记' },
  placeholders: { name: '例如：艾琳·灰烬', notes: '写下信念、缺陷或背景钩子' },
  pointBuyTitle: '属性点购',
  costPrefix: '消耗',
  finalPrefix: '最终',
  extraAbilityTitle: '额外属性',
  classSkillTitle: '职业技能',
  raceSkillTitle: '额外技能',
  previewEyebrow: '预览',
  previewEmpty: '选择种族后查看特性',
  previewHp: '初始生命',
  previewAc: '默认护甲',
  proficiencyTitle: '熟练与豁免',
  inventoryTitle: '起始装备',
  submit: '创建角色并进入冒险',
  chooseCount: '请选择',
  itemsSuffix: '项',
}

const rules = getRules()
const labels = ABILITY_LABELS
const abilityKeys = ABILITY_KEYS
const abilityHints: Record<AbilityKey, string> = {
  strength: '近战爆发与负重',
  dexterity: '敏捷行动与潜行',
  constitution: '耐力与生命值',
  intelligence: '知识与调查',
  wisdom: '察觉与直觉',
  charisma: '交涉与存在感',
}
const pointCosts = rules.pointBuy.costs as Record<string, number>
const form = reactive<CharacterPayload>({
  name: '', raceId: 'human', classId: 'fighter', notes: '', classSkillSelections: [], raceSkillSelections: [], bonusAbilityChoices: [],
  baseStats: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 10, charisma: 8 },
})

const baseStatsModel = form.baseStats as Record<AbilityKey, number>
const classSkillsModel = computed({ get: () => form.classSkillSelections, set: (value: string[]) => { form.classSkillSelections = value } })
const raceSkillsModel = computed({ get: () => form.raceSkillSelections ?? [], set: (value: string[]) => { form.raceSkillSelections = value } })
const bonusAbilityChoicesModel = computed({ get: () => (form.bonusAbilityChoices ?? []) as AbilityKey[], set: (value: AbilityKey[]) => { form.bonusAbilityChoices = value } })
const spentPoints = computed(() => getPointBuySpent(baseStatsModel))
const remainingPoints = computed(() => rules.pointBuy.budget - spentPoints.value)
const raceRule = computed(() => getRaceRule(form.raceId))
const classRule = computed(() => getClassRule(form.classId))
const finalStats = computed(() => computeFinalStats({ raceId: form.raceId, baseStats: baseStatsModel, bonusAbilityChoices: bonusAbilityChoicesModel.value }))
const derived = computed(() => computeDerivedValues({ classId: form.classId, raceId: form.raceId, baseStats: baseStatsModel, bonusAbilityChoices: bonusAbilityChoicesModel.value }))
const bonusAbilityOptions = computed(() => abilityKeys.filter((ability) => !raceRule.value?.bonusAbilityChoices?.exclude?.includes(ability)))
const raceGroups = computed(() => {
  const groups = new Map<string, Array<{ id: string; name: string }>>()
  for (const race of rules.races) {
    if (!groups.has(race.group)) groups.set(race.group, [])
    groups.get(race.group)?.push({ id: race.id, name: race.name })
  }
  return [...groups.entries()].map(([label, options]) => ({ label, options }))
})
const combinedSkillPreview = computed(() => [...new Set([...(raceRule.value?.fixedSkills ?? []), ...classSkillsModel.value, ...raceSkillsModel.value])])
const pointBuySummary = computed(() => `已用 ${spentPoints.value} / ${rules.pointBuy.budget}，剩余 ${remainingPoints.value}`)
const extraAbilitySummary = computed(() => `${text.chooseCount} ${raceRule.value?.bonusAbilityChoices?.count ?? 0} ${text.itemsSuffix}`)
const classSkillSummary = computed(() => `${text.chooseCount} ${classRule.value?.skillChoices.count ?? 0} ${text.itemsSuffix}`)
const raceSkillSummary = computed(() => `${text.chooseCount} ${raceRule.value?.bonusSkillChoices ?? 0} ${text.itemsSuffix}`)
const savingThrowText = computed(() => `豁免：${classRule.value?.savingThrows?.map(formatAbilityLabel).join(' / ') || '-'}`)

const validationMessage = computed(() => {
  if (!form.name.trim()) return '请输入角色姓名'
  if (remainingPoints.value < 0) return '属性点超过 27 点购预算'
  if (classRule.value && classSkillsModel.value.length !== classRule.value.skillChoices.count) return `请选择 ${classRule.value.skillChoices.count} 项职业技能`
  if (raceRule.value?.bonusAbilityChoices && bonusAbilityChoicesModel.value.length !== raceRule.value.bonusAbilityChoices.count) return `请选择 ${raceRule.value.bonusAbilityChoices.count} 项额外属性`
  if (raceRule.value?.bonusSkillChoices && raceSkillsModel.value.length !== raceRule.value.bonusSkillChoices) return `请选择 ${raceRule.value.bonusSkillChoices} 项种族额外技能`
  return ''
})

function formatAbilityLabel(value: string) {
  return labels[value as AbilityKey] ?? value
}

function adjustBaseStat(key: AbilityKey, delta: number) {
  const next = baseStatsModel[key] + delta
  if (next < 8 || next > 15) return
  baseStatsModel[key] = next
}

function submit() {
  if (validationMessage.value) {
    ElMessage.warning(validationMessage.value)
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <div class="character-form">
    <div class="hero">
      <div class="eyebrow">{{ text.eyebrow }}</div>
      <h1 class="title">{{ text.title }}</h1>
      <p class="subtitle">{{ text.subtitle }}</p>
      <div class="badges">
        <ElTag type="primary">{{ text.badges.pointBuy }}</ElTag>
        <ElTag type="success">{{ text.badges.validation }}</ElTag>
        <ElTag type="info">{{ text.badges.locked }}</ElTag>
      </div>
    </div>

    <div class="grid">
      <ElCard class="identity" shadow="never">
        <template #header>
          <div class="section-title">{{ text.identityTitle }}</div>
          <div class="section-hint">{{ text.identityHint }}</div>
        </template>

        <div class="field">
          <label>{{ text.labels.name }}</label>
          <ElInput v-model="form.name" :placeholder="text.placeholders.name" maxlength="24" show-word-limit />
        </div>

        <div class="field">
          <label>{{ text.labels.class }}</label>
          <ElSelect v-model="form.classId" class="w-full" popper-class="codex-dark-select">
            <ElOption v-for="c in rules.classes" :key="c.id" :label="c.name" :value="c.id" />
          </ElSelect>
        </div>

        <div class="field">
          <label>{{ text.labels.race }}</label>
          <ElSelect v-model="form.raceId" class="w-full" popper-class="codex-dark-select">
            <ElOptionGroup v-for="g in raceGroups" :key="g.label" :label="g.label">
              <ElOption v-for="opt in g.options" :key="opt.id" :label="opt.name" :value="opt.id" />
            </ElOptionGroup>
          </ElSelect>
        </div>

        <div class="field">
          <label>{{ text.labels.notes }}</label>
          <ElInput v-model="form.notes" type="textarea" :rows="3" :placeholder="text.placeholders.notes" maxlength="200" show-word-limit />
        </div>
      </ElCard>

      <ElCard class="point-buy" shadow="never">
        <template #header>
          <div class="section-title">{{ text.pointBuyTitle }}</div>
          <div class="section-hint">{{ pointBuySummary }}</div>
        </template>

        <div class="abilities">
          <div v-for="key in abilityKeys" :key="key" class="ability-row">
            <div class="ability-meta">
              <div class="ability-name">{{ labels[key] }}</div>
              <div class="ability-hint">{{ abilityHints[key] }}</div>
            </div>
            <div class="ability-control">
              <ElButton size="small" :disabled="baseStatsModel[key] <= 8" @click="adjustBaseStat(key, -1)">-</ElButton>
              <div class="ability-value">{{ baseStatsModel[key] }}</div>
              <ElButton size="small" :disabled="baseStatsModel[key] >= 15" @click="adjustBaseStat(key, 1)">+</ElButton>
            </div>
            <div class="ability-final">
              <span class="final-label">{{ text.finalPrefix }}</span>
              <span class="final-value">{{ finalStats[key] }}</span>
              <span class="cost-label">{{ text.costPrefix }} {{ pointCosts[String(baseStatsModel[key])] ?? 0 }}</span>
            </div>
          </div>
        </div>
      </ElCard>

      <ElCard v-if="raceRule?.bonusAbilityChoices" class="extra-abilities" shadow="never">
        <template #header>
          <div class="section-title">{{ text.extraAbilityTitle }}</div>
          <div class="section-hint">{{ extraAbilitySummary }}</div>
        </template>
        <div class="checkbox-group">
          <label v-for="ability in bonusAbilityOptions" :key="ability" class="checkbox">
            <input v-model="bonusAbilityChoicesModel" type="checkbox" :value="ability" :disabled="!bonusAbilityChoicesModel.includes(ability) && bonusAbilityChoicesModel.length >= (raceRule?.bonusAbilityChoices?.count ?? 0)" />
            <span>{{ labels[ability] }}</span>
          </label>
        </div>
      </ElCard>

      <ElCard class="class-skills" shadow="never">
        <template #header>
          <div class="section-title">{{ text.classSkillTitle }}</div>
          <div class="section-hint">{{ classSkillSummary }}</div>
        </template>
        <div class="checkbox-group">
          <label v-for="skill in classRule?.skillChoices?.options ?? []" :key="skill" class="checkbox">
            <input v-model="classSkillsModel" type="checkbox" :value="skill" :disabled="!classSkillsModel.includes(skill) && classSkillsModel.length >= (classRule?.skillChoices?.count ?? 0)" />
            <span>{{ getSkillLabel(skill) }}</span>
          </label>
        </div>
      </ElCard>

      <ElCard v-if="(raceRule?.bonusSkillChoices ?? 0) > 0" class="race-skills" shadow="never">
        <template #header>
          <div class="section-title">{{ text.raceSkillTitle }}</div>
          <div class="section-hint">{{ raceSkillSummary }}</div>
        </template>
        <div class="checkbox-group">
          <label v-for="skill in rules.skills" :key="skill" class="checkbox">
            <input v-model="raceSkillsModel" type="checkbox" :value="skill" :disabled="!raceSkillsModel.includes(skill) && raceSkillsModel.length >= (raceRule?.bonusSkillChoices ?? 0)" />
            <span>{{ getSkillLabel(skill) }}</span>
          </label>
        </div>
      </ElCard>

      <ElCard class="preview" shadow="never">
        <template #header>
          <div class="section-title">{{ text.previewEyebrow }}</div>
        </template>
        <div v-if="!raceRule" class="preview-empty">{{ text.previewEmpty }}</div>
        <div v-else class="preview-content">
          <div class="preview-line">
            <span class="preview-label">{{ text.previewHp }}</span>
            <span class="preview-value">{{ derived.maxHp }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-label">{{ text.previewAc }}</span>
            <span class="preview-value">{{ derived.armorClass }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-label">{{ text.proficiencyTitle }}</span>
            <span class="preview-value">{{ savingThrowText }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-label">{{ text.inventoryTitle }}</span>
            <span class="preview-value">{{ derived.inventory.map((i) => i.name + '×' + i.quantity).join('，') }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-label">{{ text.classSkillTitle }}</span>
            <span class="preview-value">{{ combinedSkillPreview.join('，') || '-' }}</span>
          </div>
        </div>
      </ElCard>
    </div>

    <div class="actions">
      <ElButton type="primary" size="large" :disabled="!!validationMessage" @click="submit">{{ text.submit }}</ElButton>
      <!-- 内联校验提示：代替 toast，用户可直接看到未完成项 -->
      <span v-if="validationMessage" class="inline-error">{{ validationMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.character-form {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.hero {
  text-align: center;
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px;
}

.badges {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.section-title {
  font-weight: 600;
}

.section-hint {
  font-size: 12px;
  color: #6b7280;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
}

.w-full {
  width: 100%;
}

.abilities {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ability-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ability-meta {
  flex: 1;
}

.ability-name {
  font-weight: 600;
}

.ability-hint {
  font-size: 12px;
  color: #6b7280;
}

.ability-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ability-value {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}

.ability-final {
  min-width: 80px;
  text-align: right;
  font-size: 14px;
}

.final-label {
  color: #6b7280;
}

.final-value {
  font-weight: 700;
  margin: 0 4px;
}

.cost-label {
  font-size: 12px;
  color: #9ca3af;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox input {
  cursor: pointer;
}

.preview-empty {
  color: #9ca3af;
  font-size: 14px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-line {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.preview-label {
  color: #6b7280;
  min-width: 80px;
}

.preview-value {
  font-weight: 500;
}

.actions {
  margin-top: 24px;
  text-align: center;
}
</style>
