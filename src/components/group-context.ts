import type { ComputedRef, InjectionKey } from 'vue'
export interface GroupContext {
  name: string; selected: string | string[] | undefined; disabled: boolean; readonly: boolean; invalid: boolean
  change(value: string, selected?: boolean): void
}
export const RadioGroupKey: InjectionKey<ComputedRef<GroupContext>> = Symbol('annexus-radio')
export const MultiSelectGroupKey: InjectionKey<ComputedRef<GroupContext>> = Symbol('annexus-multiselect')
