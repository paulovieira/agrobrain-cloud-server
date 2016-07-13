'use strict';

const JsonMarkup = require('json-markup');
const Config = require('nconf');

const internals = {};

exports.getClientCode = function (token){

    return Config.get('clientCodes')[token];
};

exports.jsonMarkup = function (value){

    const s = `
<html>
<head>
<style>

.json-markup {
    line-height: 17px;
    font-size: 13px;
    font-family: monospace;
    white-space: pre;
}
.json-markup-key {
    font-weight: bold;
}
.json-markup-bool {
    color: firebrick;
}
.json-markup-string {
    color: green;
}
.json-markup-null {
    color: gray;
}
.json-markup-number {
    color: blue;
}

</style>
</head>
<body>

    ${ JsonMarkup(value) }

</body>
</html>
`;

    return s;
};
