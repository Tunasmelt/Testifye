// app.jsx — Main app + Tweaks

const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "obsidian",
  "density": "comfortable",
  "showSidekickPane": true
}/*EDITMODE-END*/;

function TesifyeApp() {
  const [tab, setTab] = useStateApp('overview');
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme',
      tweaks.theme === 'lighter' ? 'lighter-glass' :
      tweaks.theme === 'mono' ? 'mono-violet' : '');
  }, [tweaks.theme]);

  const Pages = {
    overview: window.OverviewPage,
    'test-gen': window.TestCasesPage,
    ux: window.UXPage,
    bugs: window.BugReportPage,
    gaps: window.GapsPage,
    link: window.SemanticLinkPage,
    data: window.TestDataPage,
    persona: window.PersonaPage,
    i18n: window.I18nPage,
    export: window.ExportPage,
  };
  const Page = Pages[tab] || window.OverviewPage;

  return (
    <div className="tf-app">
      <window.Sidebar activeTab={tab} onTabChange={setTab}/>
      <div className="tf-main">
        <window.Topbar activeTab={tab}/>
        <div className="tf-content">
          <Page onNav={setTab} key={tab}/>
        </div>
      </div>
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Theme">
          <window.TweakRadio
            value={tweaks.theme}
            onChange={v=>setTweak('theme', v)}
            options={[
              {value:'obsidian', label:'Obsidian'},
              {value:'lighter', label:'Lighter'},
              {value:'mono', label:'Mono+Violet'},
            ]}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TesifyeApp/>);
