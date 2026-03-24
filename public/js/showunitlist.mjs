// 异步加载单位列表
async function unitList(e, units) {
    const unit = e.target;
    const unitList = e.target.closest('div').querySelector('#unitList');
    if(unitList.style.display === 'flex'){
        console.log('开始隐藏列表')
        unitList.style.display = 'none';
        return
    }
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
export {unitList};