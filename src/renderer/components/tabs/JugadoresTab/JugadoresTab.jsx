import React, { useState, useEffect } from 'react';
import SidebarPlayers from './SidebarPlayers';
import ExpedienteRaider from './ExpedienteRaider';
import VincularAlterModal from './VincularAlterModal';
import RaiderNotesModal from '../../shared/RaiderNotesModal';

export default function JugadoresTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [raiders, setRaiders] = useState([]); 
    const [selectedRaider, setSelectedRaider] = useState(null); 
    const [profile, setProfile] = useState(null); 
    const [loadingList, setLoadingList] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // 🔗 ESTADOS: Gestión de Vinculación de Alters
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [alterSearchTerm, setAlterSearchTerm] = useState('');
    const [alterResults, setAlterResults] = useState([]);
    const [loadingAlters, setLoadingAlters] = useState(false);

    // 🔗 ESTADOS: Gestoón de Notas
    const [showNotesModal, setShowNotesModal] = useState(false);


    // 🔍 ACCIÓN: Consulta de búsqueda principal
    async function ejecutarBusqueda(termino) {
        setLoadingList(true);
        try {
            const results = await window.apiDB.searchPlayers(termino);
            setRaiders(results || []);
        } catch (error) {
            console.error("Error al buscar raiders:", error);
        } finally {
            setLoadingList(false);
        }
    }

    // ⚡ CONTROLADOR: Carga inicial y Debounce reactivo de lista principal
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setLoadingList(true);
            window.apiDB.searchPlayers('')
                .then(iniciales => setRaiders(iniciales || []))
                .catch(err => console.error("Error en carga base:", err))
                .finally(() => setLoadingList(false));
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            ejecutarBusqueda(searchTerm);
        }, 350);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // ⚡ CONTROLADOR: Debounce reactivo dentro del modal de Alters
    useEffect(() => {
        if (!showLinkModal) return;
        
        if (alterSearchTerm.trim() === '') {
            setAlterResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoadingAlters(true);
            try {
                const results = await window.apiDB.searchPlayers(alterSearchTerm);
                const rIdActual = selectedRaider?.raider_id || selectedRaider?.id;
                const filtrados = (results || []).filter(r => (r.raider_id || r.id) !== rIdActual);
                setAlterResults(filtrados);
            } catch (err) {
                console.error("Error buscando alters:", err);
            } finally {
                setLoadingAlters(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [alterSearchTerm, showLinkModal, selectedRaider]);

    // 📂 SELECCIÓN: Carga expediente exclusivo del personaje
    async function handleSelectRaider(raider) {
        if (!raider) return;

        const rId = raider.raider_id || raider.id; 
        const pId = raider.player_id || raider.owner_id || 0;

        setSelectedRaider(raider);
        setLoadingProfile(true);
        
        try {
            console.log(`[React IPC] Enviando -> Player ID: ${pId}, Raider ID: ${rId}`);
            const data = await window.apiDB.getPlayerProfile(Number(pId), Number(rId));
            setProfile(data);
        } catch (error) {
            console.error('Error al cargar expediente del Raider:', error);
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    }

    // ⚡ PROCESAR VINCULACIÓN: Fusión de registros en SQLite
    async function ejecutarVinculacion(alter) {
        const idActual = selectedRaider.raider_id || selectedRaider.id;
        const idAlter = alter.raider_id || alter.id;

        const confirmar = window.confirm(`¿Estás seguro de que quieres fusionar a ${alter.nickname} con ${selectedRaider.nickname}? Esto unificará sus historiales bajo una sola cuenta maestra.`);
        if (!confirmar) return;

        try {
            setLoadingProfile(true);
            setShowLinkModal(false);
            
            const res = await window.apiDB.linkRaiders(idActual, idAlter);
            
            if (res.success) {
                setAlterSearchTerm('');
                setAlterResults([]);
                
                const listaActualizada = await window.apiDB.searchPlayers(searchTerm);
                setRaiders(listaActualizada || []);

                const personajeActualizado = listaActualizada.find(r => (r.raider_id || r.id) === idActual);

                if (personajeActualizado) {
                    setSelectedRaider(personajeActualizado);
                    await handleSelectRaider(personajeActualizado);
                } else {
                    const nuevoPlayerId = alter.player_id || alter.owner_id || idActual;
                    const fallbackRaider = { ...selectedRaider, player_id: nuevoPlayerId, owner_id: nuevoPlayerId };
                    setSelectedRaider(fallbackRaider);
                    await handleSelectRaider(fallbackRaider);
                }
            }
        } catch (error) {
            alert(`Error en la fusión: ${error.message}`);
        } {
            setLoadingProfile(false);
        }
    }

    async function handleEliminarNota(noteId) {
        if (!confirm("¿Seguro que quieres borrar este registro de sanción?")) return;
        try {
            await window.apiDB.deleteNote(Number(noteId));
            await handleSelectRaider(selectedRaider); // Refresca expediente
        } catch (e) {
            console.error(e);
        }
    }

    // ✍️ ACCIÓN: Editar nota inline desde la tarjeta
    async function handleEditarNotaInline(noteId, newText, newSeverity) {
        try {
            // Llama directamente a tu consulta SQL UPDATE
            await window.apiDB.updateNote(Number(noteId), newText, newSeverity);
            
            // Volvemos a pedir el perfil para pintar los cambios frescos
            await handleSelectRaider(selectedRaider);
        } catch (error) {
            console.error("Error al actualizar la nota:", error);
            alert("No se pudo guardar la modificación.");
        }
    }    

    async function handleGuardarNota(raiderIdOrName, noteText, severity) {
        const rId = selectedRaider.raider_id || selectedRaider.id || raiderIdOrName;

        try {
            // Ejecutamos la inserción (pasa el ID del raider, null para sessionId, texto y severidad)
            const insertId = await window.apiDB.addRaiderNota(Number(rId), null, noteText, severity);

            // 🎯 Como tu DB retorna el 'lastInsertRowid' (un número mayor a 0 si se insertó), 
            // validamos simplemente que la respuesta exista o sea un ID válido.
            if (insertId) {
                setShowNotesModal(false); // 🔓 ¡Ahora sí se cerrará inmediatamente!
                
                // Refrescamos los datos del expediente para ver la nota en la lista
                await handleSelectRaider(selectedRaider);
                
                // Refrescamos la barra lateral por si cambió el score total de gravedad
                if (typeof searchTerm !== 'undefined') {
                    const listaActualizada = await window.apiDB.searchPlayers(searchTerm);
                    setRaiders(listaActualizada || []);
                }
            }
        } catch (error) {
            console.error("Error al guardar la nota:", error);
            alert(`No se pudo registrar el incidente: ${error.message}`);
        }
    }


    function cerrarModalAlter() {
        setShowLinkModal(false);
        setAlterSearchTerm('');
        setAlterResults([]);
    }



    return (
        <div className="flex-1 gap-6 overflow-hidden flex h-full relative">
            
            {/* PANEL IZQUIERDO: BUSCADOR E ÍNDICE */}
            <SidebarPlayers 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                raiders={raiders}
                selectedRaider={selectedRaider}
                loadingList={loadingList}
                onSearch={ejecutarBusqueda}
                onSelectRaider={handleSelectRaider}
            />

            {/* PANEL DERECHO: EXPEDIENTE INDIVIDUAL */}
            <ExpedienteRaider 
                loadingProfile={loadingProfile}
                profile={profile}
                selectedRaider={selectedRaider}
                onOpenLinkModal={() => setShowLinkModal(true)}
                onOpenNotesModal={() => setShowNotesModal(true)}
                onEditNote={handleEditarNotaInline}
                onDeleteNote={handleEliminarNota}
            />

            {/* MODAL INTERNO FLOTANTE: VINCULAR ALTERS */}
            <VincularAlterModal 
                isOpen={showLinkModal}
                onClose={cerrarModalAlter}
                selectedRaider={selectedRaider}
                alterSearchTerm={alterSearchTerm}
                setAlterSearchTerm={setAlterSearchTerm}
                alterResults={alterResults}
                loadingAlters={loadingAlters}
                onExecuteLink={ejecutarVinculacion}
            />

            {showNotesModal && selectedRaider && (
                <RaiderNotesModal 
                    raider={{
                        id: selectedRaider.raider_id || selectedRaider.id,
                        name: selectedRaider.nickname,
                        notes: '',
                        defaultSeverity: 'LOW'
                    }}
                    onClose={() => setShowNotesModal(false)}
                    onSave={handleGuardarNota}
                />
            )}

        </div>
    );
}