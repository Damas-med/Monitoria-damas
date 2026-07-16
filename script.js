const CONFIG = {
  SHEET_ID:   "COLE_AQUI_O_ID_DA_PLANILHA",
  SHEET_NAME: "Monitorias",
};
// Colunas: A=titulo, B=professor, C=area, D=vagas, E=modalidade, F=horas_semanais, G=status, H=icone, I=imagem_url, J=link, K=cor_card

const LIMITE = 8;
let todas=[], filtroArea="", filtroBusca="", filtroModal="", filtroStatus="", mostrarTodas=false;
const modalOpcoes=["","Voluntária","Com bolsa"], statusOpcoes=["","Aberto","Em breve","Encerrado"];
let modalIdx=0, statusIdx=0;

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function stClass(s){ const v=sl(s); if(v.includes("aberto"))return"status-aberto"; if(v.includes("breve"))return"status-breve"; return"status-encerrado"; }

async function carregar(){
  try {
    const url=`https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const text=await (await fetch(url)).text();
    const json=JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const v=(row,i)=>row.c[i]?(row.c[i].f||row.c[i].v||""):"";
    todas=(json.table.rows||[]).slice(1).map(row=>({
      titulo:        v(row,0),
      professor:     v(row,1),
      area:          v(row,2),
      vagas:         v(row,3),
      modalidade:    v(row,4),
      horas_semanais:v(row,5),
      status:        v(row,6),
      icone:         v(row,7),
      imagem_url:    v(row,8),
      link:          v(row,9),
      cor_card:      v(row,10),
    })).filter(o=>String(o.titulo||"").trim()!=="");
    renderizar();
  } catch(e){
    console.error(e);
    document.getElementById("grid").innerHTML=`<div class="loading-wrap">⚠️ Erro ao carregar.<br><small>${e.message}</small></div>`;
  }
}

function filtradas(){
  return todas.filter(o=>{
    if(filtroArea  &&sl(o.area||"")!==sl(filtroArea))   return false;
    if(filtroBusca &&!sl(o.titulo||"").includes(filtroBusca)&&!sl(o.professor||"").includes(filtroBusca)) return false;
    if(filtroModal &&sl(o.modalidade||"")!==sl(filtroModal)) return false;
    if(filtroStatus&&sl(o.status||"")!==sl(filtroStatus))    return false;
    return true;
  });
}

function card(o){
  const cor=o.cor_card||"#1A3D2B", icon=o.icone||"🎓", st=stClass(o.status);
  const esc=(o.titulo||"").replace(/'/g,"\\'");
  const capa=o.imagem_url?`background-image:url('${o.imagem_url}')`:`background:${cor}`;
  return `
  <div class="monitor-card" style="border-top-color:${cor}" onclick="abrirModal('${esc}')">
    <div class="card-img" style="${capa};background-size:cover;background-position:center">
      ${o.imagem_url?"":`<span style="font-size:40px">${icon}</span>`}
    </div>
    <div class="card-body">
      <div class="card-titulo">${o.titulo}</div>
      ${o.professor?`<div class="card-professor">${o.professor}</div>`:""}
      <div class="card-infos">
        ${o.vagas?`<div class="card-info-item">👥 ${o.vagas}</div>`:""}
        ${o.modalidade?`<div class="card-info-item">💰 ${o.modalidade}</div>`:""}
        ${o.horas_semanais?`<div class="card-info-item">⏱️ ${o.horas_semanais}</div>`:""}
        ${o.area?`<div class="card-info-item">📚 ${o.area}</div>`:""}
      </div>
      ${o.status?`<div class="card-status ${st}">${o.status}</div>`:""}
      <button class="card-btn">Saiba mais →</button>
    </div>
  </div>`;
}

function renderizar(){
  const f=filtradas(), grid=document.getElementById("grid"), vw=document.getElementById("ver-todas-wrap");
  if(!f.length){grid.innerHTML=`<div class="loading-wrap">Nenhuma monitoria encontrada.</div>`;vw.style.display="none";return;}
  grid.innerHTML=(mostrarTodas?f:f.slice(0,LIMITE)).map(card).join("");
  vw.style.display=(!mostrarTodas&&f.length>LIMITE)?"":"none";
}

function filtrar(){filtroBusca=document.getElementById("busca-input").value.toLowerCase();mostrarTodas=false;renderizar();}
function filtrarArea(btn,area){filtroArea=area;mostrarTodas=false;document.querySelectorAll(".area-pill").forEach(b=>b.classList.remove("ativa"));btn.classList.add("ativa");renderizar();}
function ciclarModalidade(){modalIdx=(modalIdx+1)%modalOpcoes.length;filtroModal=modalOpcoes[modalIdx];document.getElementById("label-modalidade").textContent=filtroModal||"Todas";document.getElementById("btn-modalidade").classList.toggle("ativo",!!filtroModal);mostrarTodas=false;renderizar();}
function ciclarStatus(){statusIdx=(statusIdx+1)%statusOpcoes.length;filtroStatus=statusOpcoes[statusIdx];document.getElementById("label-status").textContent=filtroStatus||"Todos";document.getElementById("btn-status").classList.toggle("ativo",!!filtroStatus);mostrarTodas=false;renderizar();}
function verTodas(){mostrarTodas=true;renderizar();}

function abrirModal(titulo){
  const o=todas.find(x=>x.titulo===titulo);if(!o)return;
  const cor=o.cor_card||"#1A3D2B",icon=o.icone||"🎓",st=stClass(o.status);
  const capa=o.imagem_url?`background-image:url('${o.imagem_url}');background-size:cover;background-position:center`:`background:${cor}`;
  document.getElementById("modal-content").innerHTML=`
    <div class="modal-capa" style="${capa};border-bottom-color:${cor}">${o.imagem_url?"":icon}</div>
    <div class="modal-body">
      <div class="modal-titulo">${o.titulo}</div>
      ${o.professor?`<div class="modal-professor">${o.professor}</div>`:""}
      <div class="modal-grid">
        ${o.vagas?`<div class="modal-info"><div class="modal-info-label">Vagas</div><div class="modal-info-value">👥 ${o.vagas}</div></div>`:""}
        ${o.modalidade?`<div class="modal-info"><div class="modal-info-label">Modalidade</div><div class="modal-info-value">💰 ${o.modalidade}</div></div>`:""}
        ${o.horas_semanais?`<div class="modal-info"><div class="modal-info-label">Horas semanais</div><div class="modal-info-value">⏱️ ${o.horas_semanais}</div></div>`:""}
        ${o.area?`<div class="modal-info"><div class="modal-info-label">Área</div><div class="modal-info-value">${o.area}</div></div>`:""}
        ${o.status?`<div class="modal-info"><div class="modal-info-label">Status</div><div class="modal-info-value"><span class="card-status ${st}" style="margin:0">${o.status}</span></div></div>`:""}
      </div>
      ${o.link?`<a class="modal-btn" href="${o.link}" target="_blank">Acessar edital / Inscrição ↗</a>`:`<button class="modal-btn modal-btn-disabled" disabled>Sem edital no momento</button>`}
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
}
function fecharModal(){document.getElementById("modal-overlay").classList.remove("open");}
document.addEventListener("keydown",e=>{if(e.key==="Escape")fecharModal();});
carregar();
