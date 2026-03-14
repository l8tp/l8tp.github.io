// 异步加载单位列表
async function unitList(e, units) {
    const unit = e.target;
    const unitList = e.target.closest('div').querySelector('#unitList');
    unitList.style.display = 'flex';
    unitList.innerHTML = ''
    for (let i of units){
        unitList.innerHTML += `<a>${i}</a>`
    }
    unitList.addEventListener('click', (e)=>{
        const i = e.target;
        if (i !== unitList){
            unit.innerHTML = i.innerHTML + ' ▼';
            unitList.style.display = 'none';
        }
    })
    return unitList;
};
export {unitList};