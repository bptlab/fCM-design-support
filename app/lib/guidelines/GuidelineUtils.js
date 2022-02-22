export function getConnectedElements(element) {

    let visited = [];

    function visit(element) {
        if (visited.includes(element)) {
            return;
        }
        visited.push(element);

        element.incoming.forEach(flow => {
            visit(flow.source);
        });
        element.outgoing.forEach(flow => {
            visit(flow.target);
        });
    }

    visit(element);

    return visited;
}