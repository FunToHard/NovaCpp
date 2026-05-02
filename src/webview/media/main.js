(function () {
  const vscode = acquireVsCodeApi();

  const toolchainSelect = document.getElementById('toolchain');
  const cppStandardSelect = document.getElementById('cppStandard');
  const cStandardSelect = document.getElementById('cStandard');
  const outputFormatSelect = document.getElementById('outputFormat');

  const includeList = document.getElementById('includeList');
  const newIncludeInput = document.getElementById('newInclude');
  const addIncludeBtn = document.getElementById('addIncludeBtn');

  const defineList = document.getElementById('defineList');
  const newDefineInput = document.getElementById('newDefine');
  const addDefineBtn = document.getElementById('addDefineBtn');

  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');

  let includes = [];
  let defines = [];

  // Request initial data
  vscode.postMessage({ command: 'getInitialData' });

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'init':
        renderInitialData(message.data);
        break;
      case 'saveResult':
        showStatus(message.message, message.success);
        break;
    }
  });

  function renderInitialData(data) {
    // Populate compilers
    toolchainSelect.innerHTML = '';
    data.compilers.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.path;
      opt.textContent = `${c.name} (${c.path})`;
      if (data.selectedCompiler === c.path) {
        opt.selected = true;
      }
      toolchainSelect.appendChild(opt);
    });

    // Language standards
    if (data.cppStandard) cppStandardSelect.value = data.cppStandard;
    if (data.cStandard) cStandardSelect.value = data.cStandard;
    if (data.outputFormat) outputFormatSelect.value = data.outputFormat;

    includes = data.includes || [];
    defines = data.defines || [];

    renderIncludes();
    renderDefines();
  }

  function renderIncludes() {
    includeList.innerHTML = '';
    includes.forEach((inc, index) => {
      const item = document.createElement('div');
      item.className = 'tag-item';

      const text = document.createElement('span');
      text.textContent = inc;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'danger';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        includes.splice(index, 1);
        renderIncludes();
      });

      item.appendChild(text);
      item.appendChild(removeBtn);
      includeList.appendChild(item);
    });
  }

  function renderDefines() {
    defineList.innerHTML = '';
    defines.forEach((def, index) => {
      const item = document.createElement('div');
      item.className = 'tag-item';

      const text = document.createElement('span');
      text.textContent = def;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'danger';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        defines.splice(index, 1);
        renderDefines();
      });

      item.appendChild(text);
      item.appendChild(removeBtn);
      defineList.appendChild(item);
    });
  }

  addIncludeBtn.addEventListener('click', () => {
    const val = newIncludeInput.value.trim();
    if (val && !includes.includes(val)) {
      includes.push(val);
      newIncludeInput.value = '';
      renderIncludes();
    }
  });

  newIncludeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addIncludeBtn.click();
    }
  });

  addDefineBtn.addEventListener('click', () => {
    const val = newDefineInput.value.trim();
    if (val && !defines.includes(val)) {
      defines.push(val);
      newDefineInput.value = '';
      renderDefines();
    }
  });

  newDefineInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addDefineBtn.click();
    }
  });

  saveBtn.addEventListener('click', () => {
    const payload = {
      compilerPath: toolchainSelect.value,
      cppStandard: cppStandardSelect.value,
      cStandard: cStandardSelect.value,
      outputFormat: outputFormatSelect.value,
      includes: includes,
      defines: defines
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    vscode.postMessage({
      command: 'saveSettings',
      data: payload
    });
  });

  function showStatus(text, success) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save and Apply';

    statusMessage.textContent = text;
    statusMessage.className = `status-message ${success ? 'success' : 'error'}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 4000);
  }
})();
