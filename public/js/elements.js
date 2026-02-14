// 异步加载单位列表
async function unitList() {
    const unit = document.getElementById('unit');
    const unitList = document.getElementById('unitList');
    const  response = await fetch('json/ware.json');
    const ware = await response.json();
    unitList.style.display = 'flex';
    unitList.innerHTML = ''
    for (let i of ware.unit){
        unitList.innerHTML += `<a>${i}</a>`
    }
    unitList.addEventListener('click', (e)=>{
        const i = e.target;
        if (i !== unitList){
            unit.innerHTML = i.innerHTML + ' ▼';
            unitList.style.display = 'none';
        }
    })
    unit.addEventListener('mouseout', ()=>{
        const closelist = setTimeout(()=>{unitList.style.display = 'none'}, 10)
    });
};
