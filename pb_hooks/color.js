// pb_hooks/color.js

/**
 * Эта функция-хук срабатывает ПОСЛЕ того, как запись в коллекции 'characters'
 * была создана или обновлена.
 * @param {import('pocketbase').Record} record - Запись, которая была изменена
 */
async function processCharacterImage(record) {
    if (!record || !record.get('photo')) {
        return; // Ничего не делаем, если нет фото
    }

    try {
        // Запрашиваем у PocketBase миниатюру размером 1x1 пиксель
        const thumb = $app.thumb(record, '1x1');

        // Используем встроенную в PocketBase утилиту ImageMagick для анализа цвета
        const cmd = $os.cmd(
            'convert',
            '-', // Читать картинку из стандартного ввода
            '-format',
            '%[pixel:p{0,0}]', // Формат вывода: цвет пикселя в координатах 0,0
            'info:'
        );
        
        cmd.stdin = thumb.body; // "Отправляем" картинку в команду
        const output = await cmd.output(); // Выполняем команду и ждем результат
        
        // Результат будет строкой типа "srgb(123,45,67)"
        // Преобразуем ее в стандартный "rgb(123, 45, 67)"
        const color = output.toString().trim().replace('srgb', 'rgb');
        
        if (color.startsWith('rgb')) {
            // Если цвет получен, сохраняем его в наше новое поле
            record.set('dominantColor', color);
            await $app.dao().saveRecord(record);
            console.log(`Цвет ${color} успешно сохранен для персонажа ${record.id}`);
        }
    } catch (err) {
        console.error(`Не удалось извлечь цвет для персонажа ${record.id}:`, err);
    }
}

// Регистрируем наш хук, чтобы он срабатывал после СОЗДАНИЯ записи
onRecordAfterCreateRequest('characters', async (e) => {
    await processCharacterImage(e.record);
});

// Регистрируем наш хук, чтобы он срабатывал после ОБНОВЛЕНИЯ записи
onRecordAfterUpdateRequest('characters', async (e) => {
    // Проверяем, было ли изменено поле с фотографией
    if (e.record.get('photo') !== e.original.get('photo')) {
        await processCharacterImage(e.record);
    }
});