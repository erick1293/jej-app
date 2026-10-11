(function (root) {
    'use strict';

    var actual = null;
    var siguienteId = 0;

    function emitirCambio(control) {
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function textoSeccion(control, container) {
        var titulos = Array.from(container.querySelectorAll('.section-title'));
        var anterior = titulos.filter(function (title) {
            return Boolean(title.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING);
        }).pop();
        return anterior ? anterior.textContent.trim() : '';
    }

    function pasosDe(container) {
        return Array.from(container.querySelectorAll('input, select, textarea')).filter(function (control) {
            return !['hidden', 'button', 'submit', 'reset', 'file'].includes(control.type) &&
                !control.readOnly;
        }).map(function (control, index) {
            var grupo = control.closest('.form-group-field');
            var label = grupo && grupo.querySelector('label');
            var placeholder = document.createComment('carguio-wizard-field');
            control.parentNode.insertBefore(placeholder, control);
            var valueLabel = label ? label.textContent.trim() : control.getAttribute('aria-label');
            return {
                control: control,
                placeholder: placeholder,
                parent: placeholder.parentNode,
                label: valueLabel || 'Dato ' + (index + 1),
                section: textoSeccion(control, container)
            };
        });
    }

    function agregarEstilos() {
        if (document.getElementById('carguioWizardStyles')) return;
        var style = document.createElement('style');
        style.id = 'carguioWizardStyles';
        style.textContent = [
            '.cw-overlay{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(71,85,105,.84);overflow:auto}',
            '.cw-card{--cw-accent:#0ea5e9;position:relative;box-sizing:border-box;width:min(100%,390px);margin:auto;padding:18px 16px 14px;background:#fff;border:1px solid #dbe3ee;border-left:4px solid var(--cw-accent);border-radius:12px;box-shadow:0 12px 35px rgba(15,23,42,.24);font-family:inherit;color:#1e293b}',
            '.cw-card.cw-tiro{--cw-accent:#2563eb}',
            '.cw-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(115px,160px);align-items:center;gap:8px}',
            '.cw-context{overflow:hidden;color:#334155;font-size:12px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}',
            '.cw-jump{width:100%;min-width:0;height:36px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1e293b;font:inherit;font-size:12px}',
            '.cw-progress{height:4px;margin:10px 0 18px;background:#e2e8f0;border-radius:5px;overflow:hidden}',
            '.cw-progress span{display:block;height:100%;width:0;background:var(--cw-accent);transition:width .18s ease}',
            '.cw-count{margin:0 0 8px;color:#64748b;font-size:12px}',
            '.cw-section{margin:0 0 8px;color:#64748b;font-size:12px}',
            '.cw-label{display:block;margin:0 0 10px;color:#1e293b;font-size:16px;font-weight:700;line-height:1.35}',
            '.cw-field{min-height:48px}',
            '.cw-field input,.cw-field select,.cw-field textarea{box-sizing:border-box;width:100%;min-height:46px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#1e293b;font:inherit;font-size:16px}',
            '.cw-field textarea{min-height:100px;resize:vertical}',
            '.cw-actions{display:grid;grid-template-columns:auto auto minmax(76px,1fr) auto;align-items:center;gap:7px;margin-top:14px}',
            '.cw-button{min-height:38px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}',
            '.cw-button:disabled{opacity:.45;cursor:default}',
            '.cw-button.cw-next{border-color:var(--cw-accent);background:var(--cw-accent);color:#fff;font-weight:700}',
            '.cw-button.cw-cancel{margin-left:auto;border-color:#fecaca;color:#b91c1c}',
            '.cw-actions .cw-prev{grid-column:1}.cw-actions .cw-skip{grid-column:2}.cw-actions .cw-next{grid-column:3}.cw-actions .cw-cancel{grid-column:4}',
            '@media(max-width:420px){.cw-overlay{padding:8px}.cw-card{padding:15px 12px 12px}.cw-actions{grid-template-columns:auto auto minmax(66px,1fr);gap:6px}.cw-actions .cw-cancel{grid-column:1/-1;justify-self:end;margin-top:4px}.cw-button{padding:8px 7px;font-size:11px}}',
            '@media(min-width:700px){.cw-card{padding:20px 18px 16px}.cw-label{font-size:17px}}'
        ].join('');
        document.head.appendChild(style);
    }

    function close(session) {
        if (!session) return;
        session.steps.forEach(function (step) {
            if (step.placeholder.parentNode) {
                step.placeholder.parentNode.replaceChild(step.control, step.placeholder);
            }
        });
        session.overlay.remove();
        if (actual === session) actual = null;
    }

    function mostrarPaso(session, index) {
        if (session.currentControl) session.stash.appendChild(session.currentControl);
        session.index = Math.max(0, Math.min(index, session.steps.length - 1));
        var step = session.steps[session.index];
        session.count.textContent = 'Dato ' + (session.index + 1) + ' de ' + session.steps.length;
        session.label.textContent = step.label;
        session.section.textContent = step.section;
        session.section.hidden = !step.section;
        session.progress.style.width = ((session.index + 1) / session.steps.length * 100) + '%';
        session.jump.value = String(session.index);
        session.field.replaceChildren(step.control);
        session.currentControl = step.control;
        session.previous.disabled = session.index === 0 && !session.onPrevious;
        session.next.textContent = session.index === session.steps.length - 1 ? session.finishText : 'Siguiente →';
        session.next.classList.toggle('cw-next', true);
    }

    function crearAsistente(container, options) {
        var steps = pasosDe(container);
        if (!steps.length) {
            options.onEmpty();
            return null;
        }

        agregarEstilos();
        var overlay = document.createElement('div');
        overlay.className = 'cw-overlay';
        overlay.setAttribute('role', 'presentation');
        var stash = document.createElement('div');
        stash.hidden = true;
        steps.forEach(function (step) { stash.appendChild(step.control); });
        var card = document.createElement('section');
        card.className = 'cw-card ' + (options.kind === 'tiro' ? 'cw-tiro' : '');
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        var top = document.createElement('div');
        top.className = 'cw-top';
        var context = document.createElement('div');
        context.className = 'cw-context';
        context.textContent = options.context;
        var jump = document.createElement('select');
        jump.className = 'cw-jump';
        jump.setAttribute('aria-label', 'Ir a un dato');
        steps.forEach(function (step, index) {
            var option = document.createElement('option');
            option.value = String(index);
            option.textContent = (index + 1) + '. ' + step.label;
            jump.appendChild(option);
        });
        top.append(context, jump);

        var progress = document.createElement('div');
        progress.className = 'cw-progress';
        var progressBar = document.createElement('span');
        progress.appendChild(progressBar);
        var count = document.createElement('p');
        count.className = 'cw-count';
        var section = document.createElement('p');
        section.className = 'cw-section';
        var label = document.createElement('label');
        label.className = 'cw-label';
        var field = document.createElement('div');
        field.className = 'cw-field';

        var actions = document.createElement('div');
        actions.className = 'cw-actions';
        var previous = document.createElement('button');
        previous.type = 'button';
        previous.className = 'cw-button cw-prev';
        previous.textContent = '← Anterior';
        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'cw-button cw-skip';
        skip.textContent = 'Omitir';
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'cw-button cw-next';
        var cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'cw-button cw-cancel';
        cancel.textContent = options.cancelText;
        actions.append(previous, skip, next, cancel);
        card.append(top, progress, count, section, label, field, actions);
        overlay.append(stash, card);
        document.body.appendChild(overlay);

        var session = {
            overlay: overlay,
            steps: steps,
            stash: stash,
            count: count,
            section: section,
            label: label,
            field: field,
            progress: progressBar,
            jump: jump,
            previous: previous,
            skip: skip,
            next: next,
            onPrevious: options.onPrevious,
            finishText: options.finishText
        };
        actual = session;

        previous.addEventListener('click', function () {
            if (session.index > 0) mostrarPaso(session, session.index - 1);
            else if (session.onPrevious) {
                session.onPrevious();
                if (actual === session && options.isFinished()) close(session);
            }
        });
        skip.addEventListener('click', function () {
            var control = session.steps[session.index].control;
            if (control.type === 'checkbox') control.checked = false;
            else control.value = '';
            emitirCambio(control);
            if (session.index < session.steps.length - 1) mostrarPaso(session, session.index + 1);
            else options.onFinish();
        });
        next.addEventListener('click', function () {
            if (session.index < session.steps.length - 1) mostrarPaso(session, session.index + 1);
            else options.onFinish();
        });
        jump.addEventListener('change', function () { mostrarPaso(session, Number(jump.value)); });
        cancel.addEventListener('click', function () {
            if (options.onCancel()) close(session);
        });
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay && options.onBackdrop) options.onBackdrop();
        });
        field.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                event.preventDefault();
                next.click();
            }
        });

        mostrarPaso(session, 0);
        return session;
    }

    function mostrarTiro(options) {
        if (actual && actual.kind === 'tiro') close(actual);
        var container = document.getElementById(options.containerId);
        if (!container) throw new Error('No se encontró el formulario de captura de tiro.');
        container.style.display = 'none';
        var session = crearAsistente(container, {
            kind: 'tiro',
            context: options.context,
            cancelText: 'Cancelar captura',
            finishText: options.finishText || 'Finalizar ✓',
            onPrevious: options.onPrevious,
            isFinished: function () { return container.style.display !== 'block'; },
            onFinish: function () {
                options.onNext();
                if (actual === session && container.style.display !== 'block') close(session);
            },
            onCancel: function () {
                if (!root.confirm('¿Cancelar toda la captura de esta parada? Los cambios de esta captura no se guardarán.')) return false;
                options.onCancel();
                return true;
            },
            onEmpty: function () { throw new Error('No hay campos disponibles para capturar el tiro.'); }
        });
        if (session) session.kind = 'tiro';
        return session;
    }

    function abrirPlantilla(options) {
        if (actual) close(actual);
        var rootElement = document.getElementById(options.rootId);
        var container = rootElement && rootElement.querySelector('.modal-content');
        if (!container) throw new Error('No se encontró el formulario de datos de plantilla.');
        rootElement.style.display = 'none';
        var title = container.querySelector('h3');
        var session;
        session = crearAsistente(container, {
            kind: 'plantilla',
            context: options.context || (title ? title.textContent.trim() : 'Datos de plantilla'),
            cancelText: 'Cancelar',
            finishText: 'Guardar ✓',
            onEmpty: function () { options.onFinish(); },
            onPrevious: null,
            onFinish: function () {
                options.onFinish();
                if (actual === session) close(session);
            },
            onCancel: function () {
                options.onCancel();
                return true;
            },
            onBackdrop: function () {
                if (!root.confirm('¿Cerrar el asistente de datos de plantilla?')) return;
                options.onCancel();
                if (actual === session) close(session);
            }
        });
        if (session) session.kind = 'plantilla';
        return session;
    }

    root.JEJCarguioWizard = {
        abrirPlantilla: abrirPlantilla,
        mostrarTiro: mostrarTiro
    };
})(window);
