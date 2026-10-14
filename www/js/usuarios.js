(function (root) {
    'use strict';

    var STORAGE_KEY = 'jej_personal_map';
    var PERSONAL_POR_DEFECTO = {
        supervisorJeJ: [
            { nombre: 'Hector Flores', turno: 'A' },
            { nombre: 'Hector Flores', turno: 'B' }
        ],
        supervisorDet: [
            { nombre: 'Carlos Castro', turno: 'A' },
            { nombre: 'Nicolas Valdovino', turno: 'A' },
            { nombre: 'Carlos Castro', turno: 'B' },
            { nombre: 'Nicolas Valdovino', turno: 'B' }
        ],
        responsableDet: [
            { nombre: 'Andres Bugeño', turno: 'A' },
            { nombre: 'Sergio Guerrero', turno: 'A' },
            { nombre: 'Milton ', turno: 'B' },
            { nombre: 'Patricio Vera', turno: 'B' }
        ]
    };

    function inicializar() {
        var personalMap = {};
        try {
            personalMap = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (error) {
            console.error('No se pudo leer el personal guardado.', error);
        }

        if (!personalMap || typeof personalMap !== 'object' || Array.isArray(personalMap)) {
            personalMap = {};
        }

        if (Object.keys(personalMap).length === 0) {
            personalMap = JSON.parse(JSON.stringify(PERSONAL_POR_DEFECTO));
        } else if (!personalMap.supervisorJeJ) {
            personalMap.supervisorJeJ = PERSONAL_POR_DEFECTO.supervisorJeJ.map(function (persona) {
                return { nombre: persona.nombre, turno: persona.turno };
            });
        }

        try {
            root.localStorage.setItem(STORAGE_KEY, JSON.stringify(personalMap));
        } catch (error) {
            console.error('No se pudo inicializar el personal guardado.', error);
        }
        return personalMap;
    }

    function nombres(rol, turno) {
        var mapa = inicializar();
        var registros = Array.isArray(mapa[rol]) ? mapa[rol] : [];
        return Array.from(new Set(registros.map(function (persona) {
            return typeof persona === 'string' ? { nombre: persona, turno: 'Ambos' } : persona;
        }).filter(function (persona) {
            return persona && persona.nombre && (!turno || turno === 'Especial' || !persona.turno || persona.turno === 'Ambos' || persona.turno === turno);
        }).map(function (persona) {
            return String(persona.nombre).trim();
        }).filter(Boolean)));
    }

    root.JEJUsuarios = { inicializar: inicializar, nombres: nombres };
    inicializar();
})(window);
