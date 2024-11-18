import {assign} from 'min-dash';

import {Moddle} from 'moddle';

import {Reader, Writer} from 'moddle-xml';

import Descriptor from './tc.json';

export default function TerminationConditionModdle() {
    Moddle.call(this, {tc: Descriptor});
}

TerminationConditionModdle.prototype = Object.create(Moddle.prototype);

TerminationConditionModdle.prototype.fromXML = function (xmlStr, options) {
    var typeName = 'tc:Disjunction';
    var reader = new Reader(assign({model: this, lax: false}, options));
    var rootHandler = reader.handler(typeName);

    return reader.fromXML(xmlStr, rootHandler);
};


TerminationConditionModdle.prototype.toXML = function (element, options) {
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