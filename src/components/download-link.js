import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

function byteStringToArrayBuffer(binaryString) {
  const binaryLen = binaryString.length;
  const bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function DownloadButton(props) {
  let dataURL;
  if (props && props.downloadFileContent) {
    var bytes = byteStringToArrayBuffer(props.downloadFileContent);
    const data = new Blob([bytes], { type: 'binary/octet-stream' });
    dataURL = window.URL.createObjectURL(data);
  }

  return (
    props && props.downloadFileContent &&
    <a href={dataURL} download={props.downloadFileName} className="download-link">
      {props.downloadFileName}
      <FontAwesomeIcon style={{ 'padding-left': '10px' }} icon={faDownload} />
    </a>
  );
}

export default DownloadButton;
