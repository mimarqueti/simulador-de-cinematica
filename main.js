
const canvas = document.getElementById('cenario');
const ctx = canvas.getContext('2d');

let pontosTrajetoria = []; // Vai guardar o que o Python responder
let indiceAtual = 0;       // Controla o passo da animação

// DICIONÁRIO DOS PLANETAS (Mapeado por gravidade)
const fundosPlanetas = {
    '9.81': 'assets/fundo_terra.jpg',
    '1.62': 'assets/fundo_lua.jpg',
    '3.71': 'assets/fundo_marte.jpg',
    '24.79': 'assets/fundo_jupiter.jpeg'
};

const imgFundoAtual = new Image();
imgFundoAtual.src = fundosPlanetas['9.81']; // Inicializa com a Terra

//  DICIONÁRIO DOS PROJÉTEIS (Ajustado para ler os coeficientes numéricos do seu HTML)
const imagensObjetos = {
    '0.47': 'assets/bola.png',     // Altere '0.47' se o value do option da Esfera for outro número
    '1.05': 'assets/caixa.png',    // Altere '1.05' se o value do option do Cubo for outro número
    '0.04': 'assets/foguete.png'   // Altere '0.04' se o value do option do Foguete for outro número
};

const imgProjetilAtual = new Image();
imgProjetilAtual.src = imagensObjetos['0.47']; // Inicializa com a Esfera/Bola

//  FUNÇÕES AUXILIARES PARA ATUALIZAR AS IMAGENS
function atualizarFundoDinamicamente(valorGravidade) {
    if (fundosPlanetas[valorGravidade]) {
        imgFundoAtual.src = fundosPlanetas[valorGravidade];
    }
}

function atualizarObjetoDinamicamente(valorArrasto) {
    const chaveStr = String(valorArrasto); // Garante que lê como texto no dicionário
    if (imagensObjetos[chaveStr]) {
        imgProjetilAtual.src = imagensObjetos[chaveStr];
    }
}

// OUVINTES DE EVENTOS (LISTENERS) - Atualizam assim que o usuário muda na tela
const selectObjeto = document.getElementById('select-formato');
if (selectObjeto) {
    selectObjeto.addEventListener('change', (e) => {
        atualizarObjetoDinamicamente(e.target.value);
    });
}

const selectPlaneta = document.getElementById('select-planeta');
if (selectPlaneta) {
    selectPlaneta.addEventListener('change', (e) => {
        atualizarFundoDinamicamente(e.target.value);
    });
}

function atualizarLabels() {
    document.getElementById('val-vel').innerText = document.getElementById('input-vel').value;
    document.getElementById('val-ang').innerText = document.getElementById('input-ang').value;
}
atualizarLabels();


async function dispararProjetil() {
    const gravidadeSelecionada = document.getElementById('select-planeta').value;
    const arrastoSelecionado = document.getElementById('select-formato').value;
    
    atualizarFundoDinamicamente(gravidadeSelecionada);
    atualizarObjetoDinamicamente(arrastoSelecionado);
    // Pega os dados e manda pro python
    const dadosParaPython = {
        velocidade: parseFloat(document.getElementById('input-vel').value),
        angulo: parseFloat(document.getElementById('input-ang').value),
        alturaInicial: parseFloat(document.getElementById('input-alt').value),
        massa: parseFloat(document.getElementById('input-massa').value),
        gravidade: parseFloat(gravidadeSelecionada),
        coeficienteArrasto: parseFloat(arrastoSelecionado)
    };

    console.log("Enviando pacote completo para o Python:", dadosParaPython);
    // Pega os dados calculados do python e anima
    try {
        const resposta = await fetch('https://rendercinema.onrender.com/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaPython)
        });

        const resultado = await resposta.json(); 
        pontosTrajetoria = resultado.trajetoria; 
        
        if (pontosTrajetoria && pontosTrajetoria.length > 0) {
            indiceAtual = 0;
            desenharFrame(); // Inicia o voo do projétil

            // (Dados finais)
            document.getElementById('res-alcance').innerText = resultado.alcance.toFixed(2);
            document.getElementById('res-altura').innerText = resultado.alturaMaxima.toFixed(2);
            document.getElementById('res-tempo').innerText = resultado.tempoVoo.toFixed(2);
            document.getElementById('res-vel-final').innerText = resultado.velocidadeFinal.toFixed(2);
            document.getElementById('res-energia').innerText = resultado.energiaCineticaFinal.toFixed(2);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao back-end em Python.");
    }
}


function desenharFrame() {
    if (indiceAtual >= pontosTrajetoria.length) return;

    // Fundo
    if (imgFundoAtual.complete && imgFundoAtual.naturalWidth > 0) {
        ctx.drawImage(imgFundoAtual, 0, 0, canvas.width, canvas.height);
    } else {
        // Erro
        ctx.fillStyle = "#1e272e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const escala = 4; 

    // Rastro
    if (pontosTrajetoria.length > 1) {
        
        ctx.beginPath();
        ctx.lineWidth = 3;                             
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; 
        ctx.lineCap = 'round';                         

        for (let i = 0; i <= indiceAtual; i++) {
            if (i >= pontosTrajetoria.length) break; 
            
            const p = pontosTrajetoria[i];
            const rastroX = p.x * escala;
            const rastroY = canvas.height - (p.y * escala);

            if (i === 0) {
                ctx.moveTo(rastroX, rastroY);
            } else {
                ctx.lineTo(rastroX, rastroY);
            }
        }
        ctx.stroke();
        ctx.closePath();
    }

    // Salva coordenadas
    const ponto = pontosTrajetoria[indiceAtual];
    const xPixel = ponto.x * escala;
    const yPixel = canvas.height - (ponto.y * escala);
    const tamanhoProjetil = 30; // Tamanho do objeto na tela em pixels

    // Faz girar de acordo com a trajetória
    ctx.save(); // Salva o estado original do Canvas (centro no canto superior esquerdo 0,0)
    
    ctx.translate(xPixel, yPixel); // Move o centro (0,0) do Canvas exatamente para o meio do projétil
    let angulo = 0;
    if (indiceAtual + 3 < pontosTrajetoria.length) {
        const proximoPonto = pontosTrajetoria[indiceAtual + 3];
        const proxXPixel = proximoPonto.x * escala;
        const proxYPixel = canvas.height - (proximoPonto.y * escala);
        
        const dy = proxYPixel - yPixel; // Deslocamento vertical na tela
        const dx = proxXPixel - xPixel; // Deslocamento horizontal na tela
        
        angulo = Math.atan2(dy, dx); // Descobre o ângulo em radianos
    }

    ctx.rotate(angulo + Math.PI / 2); 

    // Renderiza a imagem do projétil 
    if (imgProjetilAtual.complete && imgProjetilAtual.naturalWidth > 0) {
        ctx.drawImage(
            imgProjetilAtual, 
            -tamanhoProjetil / 2, 
            -tamanhoProjetil / 2, 
            tamanhoProjetil, 
            tamanhoProjetil
        );
    } else {
        // Caso erro
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4757';    
        ctx.fill();
        ctx.closePath();
    }

    ctx.restore(); // Desfaz o translate e o rotate

    indiceAtual += 3; 

    // Pede para o navegador renderizar o próximo frame de forma fluida
    requestAnimationFrame(desenharFrame);
}
