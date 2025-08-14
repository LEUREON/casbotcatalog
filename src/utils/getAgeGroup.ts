// project/src/utils/getAgeGroup.ts

/**
 * Определяет возрастную группу на основе возраста.
 * @param age - Возраст персонажа.
 * @returns Возрастная группа ('immortal', '45+', '18+').
 */
export const getAgeGroup = (age: number): 'immortal' | '45+' | '18+' => {
  if (age === 0) {
    return 'immortal';
  }
  if (age >= 45) {
    return '45+';
  }
  return '18+';
};