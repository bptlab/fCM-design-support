export function cartesianProduct(...list: Array<Array<any>>): Array<any> {
    return list.reduce((list, b) => list.flatMap(d => b.map(e => [d, e].flat())));
}