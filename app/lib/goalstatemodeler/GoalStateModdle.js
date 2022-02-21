import { assign } from 'min-dash';

import { Moddle } from 'moddle';

import { Reader, Writer } from 'moddle-xml';

import Descriptor from './gs.json';

export default function GoalStateModdle() {
    Moddle.call(this, {gs : Descriptor});
}

GoalStateModdle.prototype = Object.create(Moddle.prototype);

GoalStateModdle.prototype.fromXML = function (xmlStr, options) {
    var typeName = 'olc:Definitions';
    var reader = new Reader(assign({ model: this, lax: false }, options));
    var rootHandler = reader.handler(typeName);

    return reader.fromXML(xmlStr, rootHandler);
};


GoalStateModdle.prototype.toXML = function (element, options) {
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