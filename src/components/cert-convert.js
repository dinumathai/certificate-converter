import { useRef, useState } from 'react';
import p12 from '../services/p12/p12';
import * as jks from 'jks-js';

import './cert-convert.css';
import DownloadButton from './download-link';

const CertConvert = () => {
    const OPTN_PKCS12_TO_KEY_PAIR = 'Pkcs12-DER-to-Key-pair';
    const OPTN_JKS_TO_PKCS12 = "JKS-to-Pkcs12-DER";
    const OPTN_JKS_TO_KEY_PAIR = "JKS-to-Key-pair";

    const [convertType, setConvertType] = useState(OPTN_PKCS12_TO_KEY_PAIR);
    const [password, setPassword] = useState('');
    const [alias, setAlias] = useState('');
    const [optPemCertificate, setOptPemCertificate] = useState('');
    const [optPemKey, setOptPemKey] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [downloadFileContent, setDownloadFileContent] = useState(null);

    let fileDetails = useRef(null);

    let fileInputElem;

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
        setDownloadFileContent(null);
        setDownloadFileName(null);
    }

    const doConvert = () => {
        resetOutputFields();
        if (!fileDetails.current) {
            setErrorMessage('Missing input file');
            return;
        }
        convertKey();
    };

    const processP12ToKeyPair = (fileReader) => {
        let fileContent = fileReader.result;
        const { pemCertificate, pemKey } = p12.ConvertToPem(fileContent, password);
        setOptPemCertificate(pemCertificate);
        setOptPemKey(pemKey);
    }

    const processJKSToKeyPair = (fileReader) => {
        let fileContent = fileReader.result;
        const keystore = jks.toPem(fileContent, password);
        if (!keystore[alias]) {
            setErrorMessage("Invalid alias name. Available aliases are - " + Object.keys(keystore));
            return;
        }
        setOptPemCertificate(keystore[alias].cert);
        setOptPemKey(keystore[alias].key);
    }

    const processJKSToP12 = (fileReader) => {
        let fileContent = fileReader.result;
        const keystore = jks.toPem(fileContent, password);
        if (!keystore[alias]) {
            setErrorMessage("Invalid alias name. Available aliases are - " + Object.keys(keystore));
            return;
        }
        const p12Bytes = p12.ConvertCertificateToP12(keystore[alias].key, keystore[alias].cert, password)
        const fileName = fileDetails.current.name.replace(".jks", ".p12");
        setDownloadFileContent(p12Bytes);
        setDownloadFileName(fileName);
    }

    const convertKey = async () => {
        let fileReader = new FileReader();
        switch (convertType) {
            case OPTN_PKCS12_TO_KEY_PAIR:
                fileReader.onload = () => {
                    try {
                        processP12ToKeyPair(fileReader);
                    } catch (err) {
                        setErrorMessage('Error : Check input file, password [' + err.message + ']');
                        console.error(err);
                    }
                };
                fileReader.readAsBinaryString(fileDetails.current);
                break;
            case OPTN_JKS_TO_KEY_PAIR:
                fileReader.onload = () => {
                    try {
                        processJKSToKeyPair(fileReader);
                    } catch (err) {
                        setErrorMessage('Error : Check input file, password and alias [' + err.message + ']');
                        console.error(err);
                    }
                }
                fileReader.readAsArrayBuffer(fileDetails.current);
                break;
            case OPTN_JKS_TO_PKCS12:
                fileReader.onload = () => {
                    try {
                        processJKSToP12(fileReader);
                    } catch (err) {
                        setErrorMessage('Error : Check input file, password and alias [' + err.message + ']');
                        console.error(err);
                    }
                }
                fileReader.readAsArrayBuffer(fileDetails.current);
                break;
            default:
                break;
        };
    };

    const onFileTypeChange = (e) => {
        setConvertType(e.target.value);
        fileInputElem.value = '';
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
                    <option value={OPTN_JKS_TO_PKCS12}>JKS to PKCS12-DER</option>
                </select>
                <label>Input file:</label>
                <input
                    ref={(elem) => { fileInputElem = elem; }}
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
                {optPemKey && optPemKey.length > 0 && <div>
                    <label>Key:</label>
                    <textarea value={optPemKey} readOnly></textarea>
                </div>}
                {optPemCertificate && optPemKey.length > 0 && <div>
                    <label>Certificate:</label>
                    <textarea value={optPemCertificate} readOnly></textarea>
                </div>}
                {convertType === OPTN_JKS_TO_PKCS12 && <div>
                    <DownloadButton downloadFileContent={downloadFileContent} downloadFileName={downloadFileName} />
                </div>}
            </div>
        </div>
    );
}

export default CertConvert;
