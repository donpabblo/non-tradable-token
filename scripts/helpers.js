const fs = require('fs');

function writeConfig(address) {
    let result = "";
    let rawdata = fs.readFileSync('.env').toString();
    let rows = rawdata.split('\r\n');
    for (var row of rows) {
        let split = row.split("=");
        if (split[0] == "CONTRACT") {
            result += split[0] + '=' + '"' + address + '"' + '\r\n';
        } else if (split[0] != "") {
            result += split[0] + '=' + split[1] + '\r\n';
        }
    }
    fs.writeFileSync('.env', result.slice(0, -2));
}

module.exports = {
    writeConfig
}