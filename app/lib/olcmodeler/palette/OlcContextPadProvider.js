export default function OlcContextPadProvider(connect, contextPad, modeling) {
  this._connect = connect;
  this._modeling = modeling;

  contextPad.registerProvider(this);
}

OlcContextPadProvider.$inject = [
  'connect',
  'contextPad',
  'modeling'
];


OlcContextPadProvider.prototype.getContextPadEntries = function (element) {
  var connect = this._connect,
    modeling = this._modeling;

  function removeElement() {
    modeling.removeElements([element]);
  }

  function startConnect(event, element, autoActivate) {
    connect.start(event, element, autoActivate);
  }

  return {
    'delete': {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title: 'Remove',
      action: {
        click: removeElement,
        dragstart: removeElement
      }
    },
    'connect': {
      group: 'edit',
      className: 'bpmn-icon-connection',
      title: 'Connect',
      action: {
        click: startConnect,
        dragstart: startConnect
      }
    }
  };
};