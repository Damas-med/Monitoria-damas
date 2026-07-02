// ============================================
//  MONITORIAS ACADÊMICAS – DAMAS
//  Edite apenas as variáveis abaixo
// ============================================

const CONFIG = {
  SHEET_ID:   "1Wufqu3ekNGDv6UEv3Lwh-2GO0XcLC0X2xfzVCf_QGKo",
  SHEET_NAME: "Monitorias",
};

const LIMITE = 8;
let todas = [], filtroArea = "", filtroBusca = "", filtroModal = "", filtroStatus = "", mostrarTodas = false;

const modalOpcoes  = ["", "Voluntária", "Com bolsa"];
const statusOpcoes = ["", "Aberto", "Em breve", "Encerrado"];
let modalIdx = 0, statusIdx = 0;

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function statusClass(s){ const v=sl(s); if(v.includes("aberto"))return"status-aberto"; if(v.includes("breve"))return"status-breve"; return"status-encerrado"; }

// ── CARREGAR ──
async function carregar(){
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const cols = json.table.cols.map(c => c.label.toLowerCase().trim().replace(/\s+/g,"_"));

    todas = (json.table.rows||[]).map(row => {
      const obj = {};
      cols.forEach((col,i) => { const cell=row.c[i]; obj[col]=cell?(cell.f||cell.v||""):""; });
      return obj;
    }).filter(m => m.titulo && sl(m.ativo||"sim") !== "não" && sl(m.ativo||"sim") !== "nao");

    renderizar();
  } catch(e) {
    document.getElementById("monitorias-grid").innerHTML =
      `<div class="loading-wrap">⚠️ Não foi possível carregar as monitorias.<br><small>Verifique o SHEET_ID e se a planilha está compartilhada.</small></div>`;
  }
}

// ── FILTRAR ──
function filtradas(){
  return todas.filter(m => {
    if(filtroArea   && sl(m.area||"")       !== sl(filtroArea))   return false;
    if(filtroBusca  && !sl(m.titulo).includes(filtroBusca)
                    && !sl(m.disciplina||"").includes(filtroBusca)
                    && !sl(m.professor||"").includes(filtroBusca)) return false;
    if(filtroModal  && sl(m.modalidade||"") !== sl(filtroModal))   return false;
    if(filtroStatus && sl(m.status||"")     !== sl(filtroStatus))  return false;
    return true;
  });
}

// ── CARD ──
function card(m){
  const cor   = m.cor_card || "var(--verde)";
  const icon  = m.icone || "🎓";
  const st    = statusClass(m.status);
  const capaStyle = m.imagem_url
    ? `background-image:url('${m.imagem_url}');background-size:cover;background-position:center`
    : `background:#E8F0EB`;
  const tituloEsc = (m.titulo||"").replace(/'/g,"\\'");

  return `
  <div class="monitor-card" style="border-top-color:${cor}" onclick="abrirModal('${tituloEsc}')">
    <div class="card-img" style="${capaStyle}">${m.imagem_url ? "" : icon}</div>
    <div class="card-body">
      ${m.disciplina ? `<div class="card-disciplina">${m.disciplina}</div>` : ""}
      <div class="card-titulo">${m.titulo}</div>
      ${m.professor  ? `<div class="card-professor">${m.professor}</div>` : ""}
      <div class="card-infos">
        ${m.vagas          ? `<div class="card-info-item">👥 ${m.vagas} vaga${m.vagas!="1"?"s":""}</div>` : ""}
        ${m.modalidade     ? `<div class="card-info-item">💰 ${m.modalidade}</div>` : ""}
        ${m.horas_semanais ? `<div class="card-info-item">⏱️ ${m.horas_semanais}</div>` : ""}
        ${m.local          ? `<div class="card-info-item">📍 ${m.local}</div>` : ""}
      </div>
      ${m.status ? `<div class="card-status ${st}">${m.status}</div>` : ""}
      <button class="card-btn">Saiba mais →</button>
    </div>
  </div>`;
}

// ── RENDERIZAR ──
function renderizar(){
  const f    = filtradas();
  const grid = document.getElementById("monitorias-grid");
  const btn  = document.getElementById("btn-ver-todos");

  if(!f.length){
    grid.innerHTML = `<div class="loading-wrap">Nenhuma monitoria encontrada.</div>`;
    btn.style.display = "none";
    return;
  }
  const ex = mostrarTodas ? f : f.slice(0, LIMITE);
  grid.innerHTML = ex.map(card).join("");
  btn.style.display = (!mostrarTodas && f.length > LIMITE) ? "" : "none";
}

// ── AÇÕES ──
function filtrar(){ filtroBusca=document.getElementById("busca-input").value.toLowerCase(); mostrarTodas=false; renderizar(); }
function filtrarArea(btn,area){ filtroArea=area; mostrarTodas=false; document.querySelectorAll(".area-pill").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); renderizar(); }
function ciclarModalidade(){ modalIdx=(modalIdx+1)%modalOpcoes.length; filtroModal=modalOpcoes[modalIdx]; document.getElementById("label-modalidade").textContent=filtroModal||"Todas"; document.getElementById("btn-modalidade").classList.toggle("ativo",!!filtroModal); mostrarTodas=false; renderizar(); }
function ciclarStatus(){ statusIdx=(statusIdx+1)%statusOpcoes.length; filtroStatus=statusOpcoes[statusIdx]; document.getElementById("label-status").textContent=filtroStatus||"Todos"; document.getElementById("btn-status").classList.toggle("ativo",!!filtroStatus); mostrarTodas=false; renderizar(); }
function verTodas(){ mostrarTodas=true; renderizar(); }

// ── MODAL ──
function abrirModal(titulo){
  const m = todas.find(x => x.titulo === titulo);
  if(!m) return;
  const cor  = m.cor_card || "var(--verde)";
  const icon = m.icone || "🎓";
  const st   = statusClass(m.status);
  const capaStyle = m.imagem_url
    ? `background-image:url('${m.imagem_url}');background-size:cover;background-position:center`
    : `background:#E8F0EB`;

  document.getElementById("modal-content").innerHTML = `
    <div class="modal-capa" style="${capaStyle};border-bottom-color:${cor}">
      ${m.imagem_url ? "" : icon}
    </div>
    <div class="modal-body">
      ${m.disciplina ? `<div class="modal-disciplina">${m.disciplina}</div>` : ""}
      <div class="modal-titulo">${m.titulo}</div>
      ${m.professor  ? `<div class="modal-professor">${m.professor}</div>` : ""}
      <div class="modal-grid">
        ${m.vagas          ? `<div class="modal-info"><div class="modal-info-label">Vagas</div><div class="modal-info-value">👥 ${m.vagas}</div></div>` : ""}
        ${m.modalidade     ? `<div class="modal-info"><div class="modal-info-label">Modalidade</div><div class="modal-info-value">💰 ${m.modalidade}</div></div>` : ""}
        ${m.horas_semanais ? `<div class="modal-info"><div class="modal-info-label">Horas semanais</div><div class="modal-info-value">⏱️ ${m.horas_semanais}</div></div>` : ""}
        ${m.local          ? `<div class="modal-info"><div class="modal-info-label">Local</div><div class="modal-info-value">📍 ${m.local}</div></div>` : ""}
        ${m.area           ? `<div class="modal-info"><div class="modal-info-label">Área</div><div class="modal-info-value">${m.area}</div></div>` : ""}
        ${m.status         ? `<div class="modal-info"><div class="modal-info-label">Status</div><div class="modal-info-value"><span class="card-status ${st}" style="margin:0">${m.status}</span></div></div>` : ""}
      </div>
      ${m.link
        ? `<a class="modal-btn" href="${m.link}" target="_blank">Acessar edital / Inscrição ↗</a>`
        : `<button class="modal-btn modal-btn-disabled" disabled>Sem edital no momento</button>`}
    </div>`;

  document.getElementById("modal-overlay").classList.add("open");
}
function fecharModal(){ document.getElementById("modal-overlay").classList.remove("open"); }
document.addEventListener("keydown", e => { if(e.key==="Escape") fecharModal(); });

carregar();
