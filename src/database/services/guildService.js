// src/main/services/guildService.js
import { guildRepository } from '../repositories/guildRepository.js';

export const guildService = {
    getAllGuildsActive() {
        return guildRepository.findAllActive();
    },
    getAllGuildsWithStatus() {
        return guildRepository.findAll();
    },
    createGuild(name) {
        const normalizedName = String(name || '').trim();
        if (!normalizedName) throw new Error('El nombre de la guild es obligatorio.');

        const existing = guildRepository.findByName(normalizedName);
        if (existing) return existing;

        const newId = guildRepository.create(normalizedName);
        return { id: Number(newId), name: normalizedName };
    },
    updateGuildStatus(guildId, isActive) {
        const result = guildRepository.updateStatus(guildId, isActive);
        if (result.changes === 0) throw new Error('No se encontró la guild con ese ID.');
        return { id: guildId, is_active: isActive };
    }
};