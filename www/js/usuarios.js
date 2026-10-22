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
        var guardado = root.localStorage.getItem(STORAGE_KEY);
        try {
            personalMap = JSON.parse(guardado || '{}');
        } catch (error) {
            console.error('No se pudo leer el personal guardado.', error);
        }

        if (!personalMap || typeof personalMap !== 'object' || Array.isArray(personalMap)) {
            personalMap = {};
        }

        if (guardado === null) {
            personalMap = JSON.parse(JSON.stringify(PERSONAL_POR_DEFECTO));
        }

        ['supervisorJeJ', 'supervisorDet', 'responsableDet'].forEach(function (rol) {
            if (!Array.isArray(personalMap[rol])) personalMap[rol] = [];
            personalMap[rol] = personalMap[rol].map(function (persona) {
                return typeof persona === 'string' ? { nombre: persona.trim(), turno: 'Ambos' } : persona;
            }).filter(function (persona) {
                return persona && typeof persona.nombre === 'string' && persona.nombre.trim() && ['A', 'B', 'Ambos'].indexOf(persona.turno || 'Ambos') >= 0;
            }).map(function (persona) {
                return { nombre: persona.nombre.trim(), turno: persona.turno || 'Ambos' };
            });
        });

        try {
            root.localStorage.setItem(STORAGE_KEY, JSON.stringify(personalMap));
        } catch (error) {
            console.error('No se pudo inicializar el personal guardado.', error);
        }
        return personalMap;
    }

    function guardar(personalMap) {
        var limpio = {};
        ['supervisorJeJ', 'supervisorDet', 'responsableDet'].forEach(function (rol) {
            limpio[rol] = Array.isArray(personalMap && personalMap[rol]) ? personalMap[rol].map(function (persona) {
                return { nombre: String(persona.nombre || '').trim(), turno: persona.turno || 'Ambos' };
            }).filter(function (persona) {
                return persona.nombre && ['A', 'B', 'Ambos'].indexOf(persona.turno) >= 0;
            }) : [];
        });
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(limpio));
        return limpio;
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

    root.JEJUsuarios = { inicializar: inicializar, guardar: guardar, nombres: nombres };
    inicializar();
})(window);
