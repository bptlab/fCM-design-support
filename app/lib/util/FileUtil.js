import $ from 'jquery';

export function download(name, data, encoding = 'charset=UTF-8') {
    var encodedData = encodeURIComponent(data);
    var link = document.createElement("a");
    document.body.appendChild(link);

    const fileType = name.split('.').pop();

    $(link).attr({
        'href': 'data:application/' + fileType + ';' + encoding + ',' + encodedData,
        'download': name
    });
    link.click();
    document.body.removeChild(link);
}

export function upload(callback, encoding = 'UTF-8') {
    var fileInput = document.createElement("input");
    document.body.appendChild(fileInput);

    $(fileInput).attr({'type': 'file'}).on('change', function (e) {
        var file = e.target.files[0];
        var title = e.target.files[0].name;
        var reader = new FileReader();
        if (encoding === 'base64') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file, encoding);
        }
        reader.onload = function (evt) {
            callback(evt.target.result, title);
        }
    }).trigger('click');
    document.body.removeChild(fileInput);
}