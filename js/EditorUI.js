/**
 * EditorUI — wires all Level Editor DOM event listeners.
 * Extracted from main.js to reduce composition root bloat.
 */

export function wireEditorUI(levelEditor, editorUI, ui, crosshair, editorPalette, editorProperties, editorPropList, editorToolbar, editorFileInput) {
    // Palette object type buttons
    editorPalette.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editorPalette.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            levelEditor.setPlacementType(btn.dataset.type);
            levelEditor.setTool('place');
            updateEditorToolbar(levelEditor, editorToolbar);
        });
    });

    // Toolbar tool buttons
    function updateEditorToolbar(le, toolbar) {
        toolbar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        if (le.tool === 'select') document.getElementById('tool-select').classList.add('active');
        if (le.tool === 'place') document.getElementById('tool-place').classList.add('active');
        if (le.tool === 'delete') document.getElementById('tool-delete').classList.add('active');
    }

    document.getElementById('tool-select').addEventListener('click', () => {
        levelEditor.setTool('select');
        updateEditorToolbar(levelEditor, editorToolbar);
    });
    document.getElementById('tool-place').addEventListener('click', () => {
        levelEditor.setTool('place');
        updateEditorToolbar(levelEditor, editorToolbar);
    });
    document.getElementById('tool-delete').addEventListener('click', () => {
        levelEditor.setTool('delete');
        updateEditorToolbar(levelEditor, editorToolbar);
    });

    document.getElementById('editor-export').addEventListener('click', () => {
        const json = levelEditor.exportLevel();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parkour-level.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('editor-import').addEventListener('click', () => {
        editorFileInput.click();
    });

    editorFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                levelEditor.importLevel(ev.target.result);
            } catch (err) {
                window.__DEV__ && console.warn('Failed to import level:', err);
                if (window.__DEV__) window.alert('Failed to import level: ' + err.message);
            }
        };
        reader.readAsText(file);
        editorFileInput.value = '';
    });

    document.getElementById('editor-playtest').addEventListener('click', () => {
        levelEditor.toggle();
        editorUI.classList.remove('active');
        ui.style.display = 'block';
        crosshair.style.display = 'block';
        document.body.requestPointerLock();
    });

    // Property panel binding
    return function updatePropertyPanel() {
        const props = levelEditor.getSelectedProps();
        if (!props) {
            editorProperties.classList.remove('active');
            return;
        }
        editorProperties.classList.add('active');
        editorPropList.innerHTML = '';

        Object.entries(props).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'prop-row';
            const label = document.createElement('label');
            label.textContent = key;
            row.appendChild(label);

            if (key === 'color') {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = typeof value === 'number' ? '#' + value.toString(16).padStart(6, '0') : value;
                input.addEventListener('input', (e) => {
                    levelEditor.setSelectedProp(key, parseInt(e.target.value.replace('#', ''), 16));
                });
                row.appendChild(input);
            } else if (typeof value === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.addEventListener('change', (e) => {
                    levelEditor.setSelectedProp(key, e.target.checked);
                });
                row.appendChild(input);
            } else if (typeof value === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.1';
                input.value = value;
                input.addEventListener('input', (e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) levelEditor.setSelectedProp(key, v);
                });
                row.appendChild(input);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.addEventListener('input', (e) => {
                    levelEditor.setSelectedProp(key, e.target.value);
                });
                row.appendChild(input);
            }
            editorPropList.appendChild(row);
        });
    };
}
