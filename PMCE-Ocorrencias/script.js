// ==========================================
// VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ==========================================
let currentStep = 1;
const totalSteps = 5;
let padResponsavel, padSupervisor;
let pessoaCount = 0;
let militarCount = 0;

window.onload = function() {
    // 1. Preencher as 34 AIS
    const selectAis = document.getElementById('app-ais');
    for (let i = 1; i <= 34; i++) {
        let option = document.createElement('option');
        option.value = `AIS ${i}`;
        option.text = `AIS ${i}`;
        selectAis.appendChild(option);
    }

    // 2. Inicializar os Pads de Assinatura
    const canvasResp = document.getElementById('pad-responsavel');
    const canvasSup = document.getElementById('pad-supervisor');
    
    // Ajustar resolução dos canvas para telas retina/celulares
    function resizeCanvas(canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }
    
    resizeCanvas(canvasResp);
    resizeCanvas(canvasSup);

    padResponsavel = new SignaturePad(canvasResp, { penColor: "rgb(0, 0, 0)" });
    padSupervisor = new SignaturePad(canvasSup, { penColor: "rgb(0, 0, 0)" });

    // 3. Adicionar pelo menos 1 pessoa e 1 militar inicial
    addPessoa();
    addMilitar();
};

// ==========================================
// NAVEGAÇÃO DO APLICATIVO (WIZARD)
// ==========================================
function mudarEtapa(direcao) {
    // Oculta a etapa atual
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`ind-${currentStep}`).classList.remove('active');

    currentStep += direcao;

    // Mostra a nova etapa
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById(`ind-${currentStep}`).classList.add('active');

    // Controle de Botões
    document.getElementById('btn-voltar').style.display = currentStep === 1 ? 'none' : 'block';
    
    if (currentStep === totalSteps) {
        document.getElementById('btn-avancar').style.display = 'none';
        document.getElementById('btn-gerar').style.display = 'block';
    } else {
        document.getElementById('btn-avancar').style.display = 'block';
        document.getElementById('btn-gerar').style.display = 'none';
    }
    
    window.scrollTo(0, 0);
}

// ==========================================
// CAMPOS DINÂMICOS: PESSOAS ENVOLVIDAS
// ==========================================
function addPessoa() {
    pessoaCount++;
    const container = document.getElementById('pessoas-container');
    const html = `
        <div class="dynamic-card" id="pessoa-${pessoaCount}">
            ${pessoaCount > 1 ? `<button type="button" class="btn-remove" onclick="removerElemento('pessoa-${pessoaCount}')"><i class="fas fa-trash"></i> Remover</button>` : ''}
            <h4 style="margin-top:0;">Pessoa ${pessoaCount}</h4>
            
            <div class="grid-2">
                <div class="input-group">
                    <label>Papel:</label>
                    <select class="p-papel">
                        <option>Acusado</option>
                        <option>Vítima (Não Fatal)</option>
                        <option>Vítima (Fatal)</option>
                        <option>Testemunha</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Situação:</label>
                    <select class="p-sit">
                        <option>Ficou Preso</option>
                        <option>Não Preso</option>
                        <option>Óbito</option>
                        <option>TCO / BO</option>
                    </select>
                </div>
            </div>
            
            <div class="input-group"><label>Nome Completo:</label><input type="text" class="p-nome"></div>
            
            <div class="grid-2">
                <div class="input-group"><label>Data Nascimento:</label><input type="date" class="p-nasc"></div>
                <div class="input-group"><label>Vulgo (Apelido):</label><input type="text" class="p-vulgo"></div>
            </div>
            
            <div class="input-group"><label>Antecedentes:</label><input type="text" class="p-ant"></div>
            <div class="input-group"><label>Nome da Genitora (Mãe):</label><input type="text" class="p-mae"></div>
            <div class="input-group"><label>Endereço Completo:</label><input type="text" class="p-end"></div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// ==========================================
// CAMPOS DINÂMICOS: EFETIVO POLICIAL
// ==========================================
function addMilitar() {
    militarCount++;
    const container = document.getElementById('efetivo-container');
    const html = `
        <div class="dynamic-card" id="militar-${militarCount}">
            ${militarCount > 1 ? `<button type="button" class="btn-remove" onclick="removerElemento('militar-${militarCount}')"><i class="fas fa-trash"></i> Remover</button>` : ''}
            <div class="grid-2">
                <div class="input-group">
                    <label>Posto/Grad:</label>
                    <select class="m-posto">
                        <option>Sd PM</option><option>Cb PM</option><option>Sgt PM</option>
                        <option>Subten PM</option><option>Ten PM</option><option>Cap PM</option>
                        <option>Maj PM</option><option>Ten Cel PM</option><option>Cel PM</option>
                    </select>
                </div>
                <div class="input-group"><label>Nome de Guerra:</label><input type="text" class="m-nome"></div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>Matrícula:</label><input type="text" class="m-mat"></div>
                <div class="input-group">
                    <label>Serviço IRSO?</label>
                    <select class="m-irso"><option>Não</option><option>Sim</option></select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removerElemento(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

// ==========================================
// PREPARAÇÃO E GERAÇÃO DO PDF
// ==========================================
function prepararEGerarPDF() {
    // 1. Alterar o botão para mostrar carregamento
    const btnGerar = document.getElementById('btn-gerar');
    btnGerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando Documento...';
    btnGerar.disabled = true;

    // 2. Transferir Dados Básicos do App para o Molde do PDF
    const val = (id) => document.getElementById(id).value || 'N/I';
    const text = (id, textValue) => { document.getElementById(id).innerText = textValue; };

    // Cabeçalho e Primários
    let aisText = val('app-ais') !== 'N/I' ? val('app-ais') : '';
    let bpmText = val('app-batalhao') !== 'N/I' ? val('app-batalhao') : '';
    text('pdf-cabecalho-batalhao', `${bpmText} ${aisText ? '- ' + aisText : ''}`);
    
    text('pdf-ciops', val('app-ciops'));
    text('pdf-vtr', val('app-vtr'));
    
    // Formatar Data
    let rawDate = val('app-data');
    if (rawDate !== 'N/I') {
        const parts = rawDate.split('-');
        text('pdf-data', `${parts[2]}/${parts[1]}/${parts[0]}`);
    } else { text('pdf-data', 'N/I'); }

    text('pdf-hora', val('app-hora'));
    text('pdf-lat', val('app-lat'));
    text('pdf-long', val('app-long'));
    text('pdf-logradouro', val('app-logradouro'));
    text('pdf-numero', val('app-numero'));
    text('pdf-bairro', val('app-bairro'));

    // Natureza e Tipificação (Lógica de Checkboxes)
    let naturezaSelecionada = document.querySelector('input[name="app-natureza"]:checked');
    text('pdf-natureza', naturezaSelecionada ? naturezaSelecionada.value : 'N/I');

    let tipificacoes = [];
    document.querySelectorAll('#app-tipificacoes input:checked').forEach(cb => tipificacoes.push(cb.value));
    let tipOutra = val('app-tip-outra');
    if (tipOutra !== 'N/I') tipificacoes.push(tipOutra);
    text('pdf-tipificacao', tipificacoes.length > 0 ? tipificacoes.join(' / ') : 'Nenhuma Selecionada');

    // Apreensões (Zeros por padrão se vazio)
    const num = (id) => document.getElementById(id).value || '0';
    text('pdf-q-fogo', num('q-fogo'));
    text('pdf-q-branca', num('q-branca'));
    text('pdf-q-mun', num('q-mun'));
    text('pdf-q-simulacro', num('q-simulacro'));
    text('pdf-q-carro', num('q-carro'));
    text('pdf-q-moto', num('q-moto'));
    text('pdf-q-outrosv', num('q-outrosv'));
    text('pdf-q-maconha', num('q-maconha'));
    text('pdf-q-crack', num('q-crack'));
    text('pdf-q-cocaina', num('q-cocaina'));
    text('pdf-q-outrasd', num('q-outrasd'));
    text('pdf-det-apreensao', val('app-detalhamento-apreensao'));

    // 3. Montar Tabela Dinâmica: PESSOAS
    const tbPessoas = document.getElementById('pdf-table-pessoas');
    tbPessoas.innerHTML = ''; // Limpar antes de gerar
    const blocosPessoas = document.querySelectorAll('#pessoas-container .dynamic-card');
    
    if(blocosPessoas.length === 0) {
        tbPessoas.innerHTML = '<tr><td>Nenhuma pessoa listada.</td></tr>';
    } else {
        blocosPessoas.forEach((card, index) => {
            const papel = card.querySelector('.p-papel').value;
            const sit = card.querySelector('.p-sit').value;
            const nome = card.querySelector('.p-nome').value || 'N/I';
            const masc = card.querySelector('.p-nasc').value || 'N/I';
            const vulgo = card.querySelector('.p-vulgo').value || 'N/I';
            const ant = card.querySelector('.p-ant').value || 'N/I';
            const mae = card.querySelector('.p-mae').value || 'N/I';
            const end = card.querySelector('.p-end').value || 'N/I';

            // Formatação de data nas pessoas
            let dtNasc = masc;
            if(masc !== 'N/I') {
                const p = masc.split('-');
                dtNasc = `${p[2]}/${p[1]}/${p[0]}`;
            }

            const tr = `
                <tr class="bg-gray"><td colspan="4"><strong>PESSOA ${index + 1} - ${papel.toUpperCase()}</strong> (${sit})</td></tr>
                <tr><td colspan="2"><strong>Nome:</strong> ${nome}</td><td><strong>Nascimento:</strong> ${dtNasc}</td><td><strong>Vulgo:</strong> ${vulgo}</td></tr>
                <tr><td colspan="2"><strong>Genitora:</strong> ${mae}</td><td colspan="2"><strong>Antecedentes:</strong> ${ant}</td></tr>
                <tr><td colspan="4"><strong>Endereço:</strong> ${end}</td></tr>
            `;
            tbPessoas.innerHTML += tr;
        });
    }

    // 4. Montar Tabela Dinâmica: EFETIVO
    const tbEfetivo = document.getElementById('pdf-table-efetivo');
    // Reiniciar com o cabeçalho
    tbEfetivo.innerHTML = `<tr><th style="width:15%">Posto/Grad</th><th style="width:35%">Nome de Guerra</th><th style="width:25%">Matrícula</th><th style="width:25%">IRSO</th></tr>`;
    
    const blocosMilitares = document.querySelectorAll('#efetivo-container .dynamic-card');
    blocosMilitares.forEach(card => {
        const posto = card.querySelector('.m-posto').value;
        const nome = card.querySelector('.m-nome').value || 'N/I';
        const mat = card.querySelector('.m-mat').value || 'N/I';
        const irso = card.querySelector('.m-irso').value;
        
        tbEfetivo.innerHTML += `<tr><td>${posto}</td><td>${nome}</td><td>${mat}</td><td>${irso}</td></tr>`;
    });

    // 5. Narrativa e Procedimentos
    text('pdf-narrativa', val('app-narrativa'));
    text('pdf-delegacia', val('app-delegacia'));
    text('pdf-num-proc', val('app-num-proc'));
    text('pdf-hora-enc', val('app-hora-enc'));

    // 6. Assinaturas e Rodapé
    text('pdf-nome-resp', val('app-resp-nome'));
    text('pdf-mat-resp', val('app-resp-mat'));
    text('pdf-nome-sup', val('app-sup-nome'));
    text('pdf-mat-sup', val('app-sup-mat'));

    const imgResp = document.getElementById('pdf-img-resp');
    const imgSup = document.getElementById('pdf-img-sup');
    
    if(!padResponsavel.isEmpty()) { imgResp.src = padResponsavel.toDataURL("image/png"); imgResp.style.display = 'block'; } 
    else { imgResp.style.display = 'none'; }
    
    if(!padSupervisor.isEmpty()) { imgSup.src = padSupervisor.toDataURL("image/png"); imgSup.style.display = 'block'; } 
    else { imgSup.style.display = 'none'; }

    // ========================================================
    // O SEGREDO PARA A GERAÇÃO NÃO FALHAR (Tirar do "Display None")
    // ========================================================
    const element = document.getElementById('pdf-template');
    const wrapper = document.getElementById('pdf-container-wrapper');
    
    // Mostra o elemento fora da visão do usuário rapidamente para a biblioteca renderizar
    wrapper.style.display = 'block';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';

    // Opções de alta resolução para PDF formato A4
    const opt = {
        margin:       0,
        filename:     `Relatorio_Ocorrencia_${val('app-ciops') || 'N-I'}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gera o PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Esconde de volta após o download
        wrapper.style.display = 'none';
        wrapper.style.position = 'static';
        
        // Restaura o botão
        btnGerar.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar PDF';
        btnGerar.disabled = false;
        
        alert("PDF gerado e baixado com sucesso!");
    }).catch(err => {
        console.error("Erro ao gerar PDF: ", err);
        alert("Ocorreu um erro ao gerar o documento. Tente novamente.");
        wrapper.style.display = 'none';
        btnGerar.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar PDF';
        btnGerar.disabled = false;
    });
}