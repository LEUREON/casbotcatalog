// project/src/utils/getAgeGroup.ts

/**
 * Определяет возрастную группу на основе возраста.
 * @param age - Возраст персонажа.
 * @returns Возрастная группа ('immortal', '30+', '18+').
 */
export const getAgeGroup = (age: number): 'immortal' | '30+' | '18+' => {
  if (age === 0) {
    return 'immortal';
  }
  if (age >= 30) {
    return '30+';
  }
  return '18+';
};