import { isString, assign } from 'min-dash';

import { Moddle } from 'moddle';

import { Reader, Writer } from 'moddle-xml';

export default function OlcModdle(packages, options) {
    Moddle.call(this, packages, options);
}

OlcModdle.prototype = Object.create(Moddle.prototype);

OlcModdle.prototype.fromXML = function (xmlStr, options) {
    var typeName = 'olc:Definitions';
    var reader = new Reader(assign({ model: this, lax: false }, options));
    var rootHandler = reader.handler(typeName);

    return reader.fromXML(xmlStr, rootHandler);
};


OlcModdle.prototype.toXML = function (element, options) {
    var writer = new Writer(options);

    return new Promise(function (resolve, reject) {
        try {
            var result = writer.toXML(element);

            return resolve({
                xml: result
            });
        } catch (err) {
            return reject(err);
        }
    });
};