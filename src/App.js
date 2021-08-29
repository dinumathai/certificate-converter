import CertConvert from './components/cert-convert';

function App() {
  return (
    <div className="content">
      <nav className="navbar">
        <h1>Convert Certificate Online</h1>
        <div className="links">
          <a rel="noreferrer" target="_blank" href="https://github.com/dinumathai/certificate-converter">Contact</a>
        </div>
      </nav>
      <p className="warning"><span className="bold">Security Note:</span> The certificate never leaves browser. Close the browser once done.
        Also clear your clip-board by copying some other data.</p>
      <CertConvert />
    </div>
  );
}

export default App;
