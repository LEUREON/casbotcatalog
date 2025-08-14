// project/src/utils/formatters.ts

/**
 * Возвращает правильное склонение слова "год" в зависимости от числа.
 * @param age - Возраст (число)
 * @returns Строка вида "25 лет", "21 год", "22 года".
 */
export const getAgeString = (age: number): string => {
  // Исключения для чисел от 11 до 19
  if (age % 100 >= 11 && age % 100 <= 19) {
    return `${age} лет`;
  }

  const lastDigit = age % 10;

  if (lastDigit === 1) {
    return `${age} год`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${age} года`;
  }
  
  return `${age} лет`;
};
