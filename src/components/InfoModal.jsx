export default function InfoModal({open,onClose}) {
  if(!open) return null;
  return <div className="info-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title">
      <h2 id="info-title">Sobre a plataforma</h2>
      <p>Este projeto acadêmico demonstra a consulta e a visualização de indicadores epidemiológicos por doença, ano, período e localidade no Brasil.</p>
      <p>Todos os números apresentados são simulados e não representam estatísticas oficiais do Ministério da Saúde. A estrutura foi organizada para futura integração com fontes oficiais do SUS.</p>
      <button className="primary" type="button" onClick={onClose}>Entendi</button>
    </div>
  </div>;
}