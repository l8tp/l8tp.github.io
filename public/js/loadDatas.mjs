// 获取商品数据
async function fetchWareData() {
    try {
        const response = await fetch('/json/ware.json');
        return await response.json();
    } catch (error) {
        console.error('获取商品数据失败:', error);
        alert('获取商品数据失败');
        return;
    }
}

//加载底部导航栏
async function loadBottomBar (token, bottombar) {
    const param = new URLSearchParams(window.location.search);
    const grup = param.get("name") || 'home'; //获取URL数据

    const  response = await fetch('json/bottombar.json');
    const bottomdata = await response.json();
    console.log('获取到导航栏数据');
    bottombar.innerHTML = ''
    for (let i in bottomdata){
        let tabclass = 'tab-item'
        if (i == grup){tabclass += ' active'}
        if(i !== 'profile' || token){
            bottombar.innerHTML += `<a href="${i}.html?name=${i}" class="${tabclass}"><i class="${bottomdata[i][1]}"></i>${bottomdata[i][0]}</a>`
        }
    }
};

// 异步加载单位列表
async function unitList(e, units) {
    const unit = e.target;
    const unitList = e.target.closest('div').querySelector('#unitList');
    if(unitList.style.display === 'flex'){
        unit.removeAttribute('style');
        unitList.style.display = 'none';
        return unitList;
    }
    unit.style.color = '#3498db';
    unitList.style.display = 'flex';
    unitList.innerHTML = ''
    for (let i of units){
        const a = document.createElement('a');
        a.textContent = i;
        unitList.appendChild(a);
        a.addEventListener('click', (e)=>{
            unit.innerHTML = e.target.innerHTML + ' ▼';
            unitList.style.display = 'none';
        })
    }
    return unitList;
};

export {fetchWareData, loadBottomBar, unitList};