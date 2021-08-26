import './cert-convert.css';
import { useRef, useState } from 'react';
import ConvertToPem from '../services/p12/p12';
import * as jks from 'jks-js';

const CertConvert = () => {
    const OPTN_PKCS12_TO_KEY_PAIR = 'Pkcs12-DER-to-Key-pair';
    const OPTN_JKS_TO_PKCS12 = "JKS-to-Pkcs12-DER";
    const OPTN_JKS_TO_KEY_PAIR = "JKS-to-Key-pair";

    const [convertType, setConvertType] = useState(OPTN_PKCS12_TO_KEY_PAIR);
    const [password, setPassword] = useState('');
    const [alias, setAlias] = useState(null);
    const [optPemCertificate, setOptPemCertificate] = useState('');
    const [optPemKey, setOptPemKey] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    let fileDetails = useRef(null);

    const handleFileChosen = (file) => {
        resetOutputFields();
        if (!file) {
            fileDetails.current = null;
            return;
        }
        fileDetails.current = file;
    };

    const resetOutputFields = () => {
        setErrorMessage(null);
        setOptPemKey('');
        setOptPemCertificate('');
    }

    const doConvert = () => {
        resetOutputFields();
        if (!fileDetails.current) {
            setErrorMessage('Missing input file');
            return;
        }
        try {
            convertKey();
        } catch (err) {
            setErrorMessage('Error : Check input file, password and alias [' + err.message + ']');
            console.error(err);
        }
    };

    const convertKey = async () => {
        let fileReader = new FileReader();
        let fileContent;
        switch (convertType) {
            case OPTN_PKCS12_TO_KEY_PAIR:
                fileReader.onload = () => {
                    fileContent = fileReader.result;
                    const { pemCertificate, pemKey } = ConvertToPem(fileContent, password);
                    setOptPemCertificate(pemCertificate);
                    setOptPemKey(pemKey);
                };
                fileReader.readAsBinaryString(fileDetails.current);

                break;
            case OPTN_JKS_TO_KEY_PAIR:
                fileReader.onload = () => {
                    fileContent = fileReader.result;
                    const keystore = jks.toPem(fileContent, password);
                    if (!keystore[alias]) {
                        setErrorMessage("Invalid alias name. Available aliases are - " + Object.keys(keystore));
                        return;
                    }
                    setOptPemCertificate(keystore[alias].cert);
                    setOptPemKey(keystore[alias].key);
                }
                fileReader.readAsArrayBuffer(fileDetails.current);
                break;
            default:
                break;
        };
    };

    const onFileTypeChange = (e) => {
        setConvertType(e.target.value);
        document.getElementById("file-input").value = null;
        fileDetails.current = null;
    };

    return (
        <div className="cert-convert">
            <div className="cert-convert-input">
                <label>Convert from:</label>
                <select
                    value={convertType}
                    onChange={onFileTypeChange} >
                    <option value={OPTN_PKCS12_TO_KEY_PAIR}>PKCS12-DER to TLS Key pair</option>
                    <option value={OPTN_JKS_TO_KEY_PAIR}>JKS to TLS Key pair</option>
                    <option value={OPTN_JKS_TO_PKCS12} disabled>JKS to PKCS12-DER</option>
                </select>
                <label>Input file:</label>
                <input
                    id="file-input"
                    type="file"
                    accept={convertType === OPTN_PKCS12_TO_KEY_PAIR ? '.p12' : '.jks'}
                    onChange={e => handleFileChosen(e.target.files[0])}
                />
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {convertType !== OPTN_PKCS12_TO_KEY_PAIR && <div>
                    <label>Alias:</label>
                    <input
                        type='text'
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                    />
                </div>}
                <div className='err-msg'>{errorMessage}</div>
                <button onClick={doConvert}>Convert</button>
            </div>
            <div className="cert-convert-output">
                <label>Key:</label>
                <textarea value={optPemKey} readOnly></textarea>
                <label>Certificate:</label>
                <textarea value={optPemCertificate} readOnly></textarea>
            </div>
        </div>
    );
}

export default CertConvert;
