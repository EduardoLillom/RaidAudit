import React, { useState, useEffect } from 'react';

export default function ImportarJugadoresModal({ isOpen, onClose, onImportSuccess }) {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(false);
    const [parsedList, setParsedList] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setJsonText('');
            setError(null);
            setIsValid(false);
            setParsedList([]);
            setImportResult(null);
            setIsImporting(false);
        }
    }, [isOpen]);

    // Validación de JSON en tiempo real
    useEffect(() => {
        const text = jsonText.trim();
        if (!text) {
            setError(null);
            setIsValid(false);
            setParsedList([]);
            return;
        }

        try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                setError('El elemento principal debe ser una lista (array) de objetos [ ... ]');
                setIsValid(false);
                setParsedList([]);
                return;
            }

            // Validar estructura básica (debe tener al menos name/nickname en algún elemento)
            const count = parsed.length;
            if (count === 0) {
                setError('La lista JSON está vacía.');
                setIsValid(false);
                setParsedList([]);
                return;
            }

            const invalidItem = parsed.find(item => {
                const name = item.name || item.nickname || item.character || item.character_name;
                return !name || typeof name !== 'string' || name.trim() === '';
            });

            if (invalidItem) {
                setError('Todos los jugadores deben tener la propiedad "name" o "nickname" de tipo texto.');
                setIsValid(false);
                setParsedList([]);
                return;
            }

            setError(null);
            setIsValid(true);
            setParsedList(parsed);
        } catch (e) {
            setError(`Error de formato JSON: ${e.message}`);
            setIsValid(false);
            setParsedList([]);
        }
    }, [jsonText]);

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!isValid || parsedList.length === 0) return;

        setIsImporting(true);
        try {
            const result = await window.apiDB.bulkImportPlayers(parsedList);
            setImportResult(result);
            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (err) {
            setError(`Error al importar: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn font-mono">
            <div className="bg-[#1a1b26] border-2 border-[#bb9af7]/60 rounded-xl p-5 max-w-lg w-full shadow-2xl flex flex-col gap-4 relative">
                
                {/* CABECERA */}
                <div className="flex justify-between items-center border-b border-[#414868]/40 pb-2">
                    <h3 className="text-sm font-bold text-[#bb9af7] uppercase tracking-wider">
                        // Importar Jugadores en Masa
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-black px-1.5 transition-colors cursor-pointer"
                        disabled={isImporting}
                    >
                        ✕
                    </button>
                </div>

                {!importResult ? (
                    <>
                        {/* INSTRUCCIONES */}
                        <div className="bg-[#1f2335] border border-[#414868]/60 p-2.5 rounded-lg text-[10px] text-[#a9b1d6] flex flex-col gap-1">
                            <span className="font-bold text-[#e0af68]">Formato esperado:</span>
                            <pre className="bg-[#16161e] p-1.5 rounded text-[9px] text-[#9ece6a] overflow-x-auto">
{`[
  { "name": "Zelmar", "class": "MAGE", "player": "ZelmarAccount" },
  { "name": "Veintidosf", "class": "ROGUE" }
]`}
                            </pre>
                            <span className="text-[9px] text-[#565f89] leading-tight">
                                * <code className="text-gray-300">class</code> es opcional (por defecto PALADIN).
                                <br />
                                * <code className="text-gray-300">player</code> (o <code className="text-gray-300">owner</code>) asocia el personaje a una cuenta maestra. Es opcional.
                            </span>
                        </div>

                        {/* TEXTAREA */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#565f89] uppercase tracking-wider font-bold">
                                Pega tu JSON aquí:
                            </label>
                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                placeholder='[ { "name": "Notevadoler", "class": "DEATHKNIGHT" } ]'
                                className="w-full h-44 bg-[#1f2335] border border-[#414868] rounded-lg p-3 text-xs text-[#9ece6a] outline-none resize-none focus:border-[#bb9af7] font-mono transition-colors placeholder-[#565f89]"
                                disabled={isImporting}
                            />
                        </div>

                        {/* ESTADO / ERRORES */}
                        <div className="text-[11px] min-h-[18px]">
                            {error && (
                                <span className="text-[#f7768e] bg-[#f7768e]/10 border border-[#f7768e]/30 px-2 py-0.5 rounded block w-full truncate" title={error}>
                                    ⚠ {error}
                                </span>
                            )}
                            {isValid && (
                                <span className="text-[#9ece6a] bg-[#9ece6a]/10 border border-[#9ece6a]/30 px-2 py-0.5 rounded block">
                                    ✓ JSON válido: {parsedList.length} personajes detectados.
                                </span>
                            )}
                        </div>

                        {/* ACCIONES */}
                        <div className="flex gap-2 justify-end border-t border-[#414868]/40 pt-3">
                            <button
                                onClick={onClose}
                                disabled={isImporting}
                                className="px-4 py-2 bg-[#24283b] text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-[#414868] disabled:opacity-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!isValid || isImporting}
                                className="px-5 py-2 bg-[#bb9af7] hover:bg-[#c0caf5] text-[#1a1b26] rounded-lg text-xs font-black transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wide"
                            >
                                {isImporting ? 'Importando...' : 'Procesar Importación'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* PANTALLA DE ÉXITO */}
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <span className="text-4xl text-[#9ece6a] animate-bounce">✓</span>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                ¡Importación Completada!
                            </h4>
                            <div className="bg-[#1f2335] border border-[#9ece6a]/20 p-4 rounded-lg w-full max-w-sm flex flex-col gap-2 text-xs">
                                <div className="flex justify-between items-center text-[#a9b1d6]">
                                    <span>Personajes Creados:</span>
                                    <span className="font-bold text-[#9ece6a]">{importResult.createdRaiders}</span>
                                </div>
                                <div className="flex justify-between items-center text-[#a9b1d6]">
                                    <span>Personajes Actualizados:</span>
                                    <span className="font-bold text-[#7aa2f7]">{importResult.updatedRaiders}</span>
                                </div>
                                <div className="flex justify-between items-center text-[#a9b1d6]">
                                    <span>Cuentas Creadas:</span>
                                    <span className="font-bold text-[#bb9af7]">{importResult.createdPlayers}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-[#565f89] max-w-sm mt-1">
                                {importResult.message}
                            </p>
                        </div>

                        {/* BOTÓN CERRAR FIN */}
                        <div className="flex justify-center border-t border-[#414868]/40 pt-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-[#9ece6a] hover:bg-[#73daca] text-[#1a1b26] rounded-lg text-xs font-black transition-all uppercase cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
