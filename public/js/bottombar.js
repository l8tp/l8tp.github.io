(async function () {
    const param = new URLSearchParams(window.location.search);
    const grup = param.get("name") || 'home'; //获取URL数据

    const  response = await fetch('json/bottombar.json');
    const bottomdata = await response.json();
    console.log('获取到导航栏数据');
    const bottombar = document.querySelector('.bottom-tab-bar');
    bottombar.innerHTML = ''
    for (let i in bottomdata){
        let tabclass = 'tab-item'
        if (i == grup){tabclass += ' active'}
        bottombar.innerHTML += `<a href="${i}.html?name=${i}" class="${tabclass}"><i class="${bottomdata[i][1]}"></i>${bottomdata[i][0]}</a>`
    }
})();
