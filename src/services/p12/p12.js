import * as forge from 'node-forge';

export function ConvertToPem(p12base64, password) {
    const p12Asn1 = forge.asn1.fromDer(p12base64);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    const pemKey = getKeyFromP12(p12, password);
    const pemCertificate = getCertificateFromP12(p12);

    return { pemKey, pemCertificate };
}

function getKeyFromP12(p12, password) {
    let keyData = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }, password);
    let pkcs8Key = keyData[forge.pki.oids.pkcs8ShroudedKeyBag][0];

    if (typeof pkcs8Key === 'undefined') {
        keyData = p12.getBags({ bagType: forge.pki.oids.keyBag }, password);
        pkcs8Key = keyData[forge.pki.oids.keyBag][0];
    }

    if (typeof pkcs8Key === 'undefined') {
        throw new Error('Unable to get private key');
    }

    // convert a Forge private key to an ASN.1 RSAPrivateKey
    const rsaPrivateKey = forge.pki.privateKeyToAsn1(pkcs8Key.key);
    // wrap an RSAPrivateKey ASN.1 object in a PKCS#8 ASN.1 PrivateKeyInfo
    const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
    // convert a PKCS#8 ASN.1 PrivateKeyInfo to PEM
    const pemKey = forge.pki.privateKeyInfoToPem(privateKeyInfo);
    return pemKey;
}

function getCertificateFromP12(p12) {
    const certData = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certificateList = certData[forge.pki.oids.certBag];

    let pemCertificate = '';
    certificateList.forEach(certificate => { pemCertificate += forge.pki.certificateToPem(certificate.cert) });
    return pemCertificate;
}

function ConvertCertificateToP12(privateKeyTxt, certificateChainTxt, password) {
    const certChainBeginTxt = "-----BEGIN CERTIFICATE-----";
    const certChainEndTxt = "-----END CERTIFICATE-----";
    const certChain = certificateChainTxt.split(certChainEndTxt);
    const certificateChain = [];
    certChain.forEach((certTxt) => {
        if (certTxt.indexOf(certChainBeginTxt) < 0) {
            return;
        }
        certificateChain.push(forge.pki.certificateFromPem(certTxt + certChainEndTxt));
    });

    const privateKey = forge.pki.privateKeyFromPem(privateKeyTxt);
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        privateKey, certificateChain, password, { generateLocalKeyId: true, algorithm: '3des' });

    return forge.asn1.toDer(p12Asn1).getBytes();
}

const p12 = {
    ConvertToPem,
    ConvertCertificateToP12
}
export default p12;