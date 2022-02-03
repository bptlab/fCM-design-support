import $ from 'jquery';

export function download(name, data) {
    var encodedData = encodeURIComponent(data);
    var link = document.createElement("a");
    document.body.appendChild(link);

    $(link).attr({
        'href': 'data:application/xml;charset=UTF-8,' + encodedData,
        'download': name
    });

    link.click();
    document.body.removeChild(link);
}

export function upload(callback) {
    var fileInput = document.createElement("input");
    document.body.appendChild(fileInput);

    $(fileInput).attr({ 'type': 'file' }).on('change', function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            callback(evt.target.result);
        }
    }).trigger('click');

    document.body.removeChild(fileInput);
}