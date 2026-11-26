export default function Header({onInfo}) {
  return <header>
    <div className="shell header-inner">
      <div className="brand">
        <div className="mark" aria-hidden="true">✚</div>
        <div>
          <p className="eyebrow">Plataforma de vigilância em saúde</p>
          <h1>Monitoramento Epidemiológico</h1>
          <p className="subtitle">Painel Nacional de Vigilância em Saúde</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="updated">Última atualização da simulação<strong>31 de dezembro de 2025</strong></div>
        <button className="icon-button" type="button" onClick={onInfo}>ⓘ Informações</button>
      </div>
    </div>
  </header>;
}