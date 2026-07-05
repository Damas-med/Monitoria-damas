// ============================================
//  EXTENSÃO – DAMAS
//  Edite apenas as variáveis abaixo
// ============================================

const CONFIG = {
  SHEET_ID:   "COLE_AQUI_O_ID_DA_PLANILHA",
  SHEET_NAME: "Extensão",
};

const LIMITE = 8;
let todas = [], filtroArea = "", filtroBusca = "", filtroModal = "", filtroStatus = "", mostrarTodas = false;
const modalOpcoes  = ["", "Voluntária", "Com bolsa"];
const statusOpcoes = ["", "Aberto", "Em breve", "Encerrado"];
let modalIdx = 0, statusIdx = 0;

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function statusClass(s){ const v=sl(s); if(v.includes("aberto"))return"status-aberto"; if(v.includes("breve"))return"status-breve"; return"status-encerrado"; }

async function carregar(){
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const todasLinhas = json.table.rows || [];
    const rows = todasLinhas.slice(1); // pular linha de cabeçalho
    const v = (row, i) => row.c[i] ? (row.c[i].f || row.c[i].v || "") : "";

    todas = rows.map(row => ({
      disciplina:    v(row,0),
      titulo:        v(row,1),
      professor:     v(row,2),
      area:          v(row,3),
      vagas:         v(row,4),
      modalidade:    v(row,5),
      horas_semanais:v(row,6),
      local:         v(row,7),
      status:        v(row,8),
      icone:         v(row,9),
      imagem_url:    v(row,10),
      link:          v(row,11),
      cor_card:      v(row,12),
    })).filter(o => String(o.titulo||"").trim() !== "");

    renderizar();
  } catch(e) {
    console.error(e);
    document.getElementById("grid").innerHTML =
      `<div class="loading-wrap">⚠️ Não foi possível carregar.<br><small>${e.message}</small></div>`;
  }
}

function filtradas(){
  return todas.filter(o => {
    if(filtroArea   && sl(o.area||"")       !== sl(filtroArea))   return false;
    if(filtroBusca  && !sl(o.titulo||"").includes(filtroBusca)
                    && !sl(o.disciplina||"").includes(filtroBusca)
                    && !sl(o.professor||"").includes(filtroBusca)) return false;
    if(filtroModal  && sl(o.modalidade||"") !== sl(filtroModal))   return false;
    if(filtroStatus && sl(o.status||"")     !== sl(filtroStatus))  return false;
    return true;
  });
}

function card(o){
  const cor  = o.cor_card || "#1A3D2B";
  const icon = o.icone || "🌍";
  const st   = statusClass(o.status);
  const esc  = (o.titulo||"").replace(/'/g,"\\'");
  const capa = o.imagem_url ? `background-image:url('${o.imagem_url}')` : `background:${cor}`;

  return `
  <div class="monitor-card" style="border-top-color:${cor}" onclick="abrirModal('${esc}')">
    <div class="card-img" style="${capa};background-size:cover;background-position:center">
      ${o.imagem_url ? "" : `<span style="font-size:40px">${icon}</span>`}
    </div>
    <div class="card-body">
      ${o.disciplina ? `<div class="card-disciplina">${o.disciplina}</div>` : ""}
      <div class="card-titulo">${o.titulo}</div>
      ${o.professor  ? `<div class="card-professor">${o.professor}</div>` : ""}
      <div class="card-infos">
        ${o.vagas          ? `<div class="card-info-item">👥 ${o.vagas}</div>` : ""}
        ${o.modalidade     ? `<div class="card-info-item">💰 ${o.modalidade}</div>` : ""}
        ${o.horas_semanais ? `<div class="card-info-item">⏱️ ${o.horas_semanais}</div>` : ""}
        ${o.local          ? `<div class="card-info-item">📍 ${o.local}</div>` : ""}
      </div>
      ${o.status ? `<div class="card-status ${st}">${o.status}</div>` : ""}
      <button class="card-btn">Saiba mais →</button>
    </div>
  </div>`;
}

function renderizar(){
  const f    = filtradas();
  const grid = document.getElementById("grid");
  const vw   = document.getElementById("ver-todas-wrap");
  if(!f.length){ grid.innerHTML=`<div class="loading-wrap">Nenhum projeto encontrado.</div>`; vw.style.display="none"; return; }
  grid.innerHTML = (mostrarTodas?f:f.slice(0,LIMITE)).map(card).join("");
  vw.style.display = (!mostrarTodas&&f.length>LIMITE)?"":"none";
}

function filtrar(){ filtroBusca=document.getElementById("busca-input").value.toLowerCase(); mostrarTodas=false; renderizar(); }
function filtrarArea(btn,area){ filtroArea=area; mostrarTodas=false; document.querySelectorAll(".area-pill").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); renderizar(); }
function ciclarModalidade(){ modalIdx=(modalIdx+1)%modalOpcoes.length; filtroModal=modalOpcoes[modalIdx]; document.getElementById("label-modalidade").textContent=filtroModal||"Todas"; document.getElementById("btn-modalidade").classList.toggle("ativo",!!filtroModal); mostrarTodas=false; renderizar(); }
function ciclarStatus(){ statusIdx=(statusIdx+1)%statusOpcoes.length; filtroStatus=statusOpcoes[statusIdx]; document.getElementById("label-status").textContent=filtroStatus||"Todos"; document.getElementById("btn-status").classList.toggle("ativo",!!filtroStatus); mostrarTodas=false; renderizar(); }
function verTodas(){ mostrarTodas=true; renderizar(); }

function abrirModal(titulo){
  const o=todas.find(x=>x.titulo===titulo); if(!o)return;
  const cor=o.cor_card||"#1A3D2B", icon=o.icone||"🌍", st=statusClass(o.status);
  const capaStyle=o.imagem_url?`background-image:url('${o.imagem_url}');background-size:cover;background-position:center`:`background:${cor}`;
  document.getElementById("modal-content").innerHTML=`
    <div class="modal-capa" style="${capaStyle};border-bottom-color:${cor}">
      ${o.imagem_url?"":icon}
    </div>
    <div class="modal-body">
      ${o.disciplina?`<div class="modal-disciplina">${o.disciplina}</div>`:""}
      <div class="modal-titulo">${o.titulo}</div>
      ${o.professor?`<div class="modal-professor">${o.professor}</div>`:""}
      <div class="modal-grid">
        ${o.vagas?`<div class="modal-info"><div class="modal-info-label">Vagas</div><div class="modal-info-value">👥 ${o.vagas}</div></div>`:""}
        ${o.modalidade?`<div class="modal-info"><div class="modal-info-label">Modalidade</div><div class="modal-info-value">💰 ${o.modalidade}</div></div>`:""}
        ${o.horas_semanais?`<div class="modal-info"><div class="modal-info-label">Horas semanais</div><div class="modal-info-value">⏱️ ${o.horas_semanais}</div></div>`:""}
        ${o.local?`<div class="modal-info"><div class="modal-info-label">Local</div><div class="modal-info-value">📍 ${o.local}</div></div>`:""}
        ${o.area?`<div class="modal-info"><div class="modal-info-label">Área</div><div class="modal-info-value">${o.area}</div></div>`:""}
        ${o.status?`<div class="modal-info"><div class="modal-info-label">Status</div><div class="modal-info-value"><span class="card-status ${st}" style="margin:0">${o.status}</span></div></div>`:""}
      </div>
      ${o.link
        ?`<a class="modal-btn" href="${o.link}" target="_blank">Acessar edital / Inscrição ↗</a>`
        :`<button class="modal-btn modal-btn-disabled" disabled>Sem edital no momento</button>`}
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
}
function fecharModal(){ document.getElementById("modal-overlay").classList.remove("open"); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape")fecharModal(); });

carregar();
