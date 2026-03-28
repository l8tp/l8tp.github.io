//加载列表和设置监听
function LoadAndListenFilter(filterNode, bottomTabBarNode, wareData){
    const marketLable = filterNode.querySelector('#marketLable');
    const marketInput = filterNode.querySelector('#marketInput');
    const marketList = filterNode.querySelector('#marketList');
    const wareLable = filterNode.querySelector('#wareLable');
    const wareInput = filterNode.querySelector('#wareInput');
    const wareList = filterNode.querySelector('#wareList');
    
    const filters = JSON.parse(localStorage.getItem('filters') || null);
    let markets, wares;
    if (filters) {
        console.log('加载了上次的筛选条件');
        ({markets, wares} = filters);
    }
    loadList(filterNode, marketLable, marketList, wareData.market, markets);
    loadList(filterNode, wareLable, wareList, wareData.ware, wares);

    // 根据输入筛选列表
    InputFilter(marketLable, marketInput, marketList);
    InputFilter(wareLable, wareInput, wareList);

    // 关闭按钮
    filterNode.querySelector('.Xwinpop').addEventListener('click', () => {
        filterNode.classList.add('hidden');
        bottomTabBarNode.classList.remove('hidden');
    });
    
    // 清空标签按钮
    filterNode.querySelector('#clearMarketLabel').addEventListener('click', () => {
        labelToList(marketLable, marketList);
    });

    filterNode.querySelector('#clearWareLabel').addEventListener('click', () => {
        labelToList(wareLable, wareList);
    });
}
// 删除标签并显示列表项的函数
function labelToList(label, list) {
    const spans = label.querySelectorAll('span');
    for (const span of spans) {
        const anodes = list.querySelectorAll('a');
        for (let a of anodes) {
            if (span.textContent === a.textContent) {
                a.classList.remove('hidden');
            }
        }
        span.remove();
    }
}
// 根据输入筛选列表
function InputFilter(label, input, list) {
    input.addEventListener('input', () => {
        const inputValue = input.value.trim();
        // 获取标签列表
        const spannodes = label.querySelectorAll('span');
        const spans = [];
        for (let span of spannodes) {
            spans.push(span.textContent);
        }
        
        // 筛选候选列表
        const anodes = list.querySelectorAll('a');
        for (const a of anodes) {
            // 剔除标签列表中的项和不符合输入的项
            if (spans.includes(a.textContent) || !a.textContent.includes(inputValue)) {
                a.classList.add('hidden');
            }else{
                a.classList.remove('hidden');
            }
        }
    });
}

// 加载候选列表的函数
function loadList(filterNode, label, list, data, selectedData = null) {
    // 清空列表
    list.innerHTML = '';
    
    // 添加列表项
    for (const item of data) {
        const a = document.createElement('a');
        a.textContent = item;
        list.appendChild(a);
        // 监视列表点击赋值给标签
        a.addEventListener('click', (e)=>{
            if (list === filterNode.querySelector('#marketList')) {
                const spans = label.querySelectorAll('span');
                if (spans.length > 2) {
                    DOM.message.textContent = '只能选择三个超市';
                    return;
                }
            }
            listToLabel(e.target, label)
        });
    }

    // 加载上次选择的标签
    if (selectedData) {
        const anodes = list.querySelectorAll('a');
        for (const a of anodes) {
            if (selectedData.includes(a.textContent.split('#')[0])) {
                listToLabel(a, label);
            }
        }
    }
}
// 列表赋值给标签并隐藏列表项，点击标签删除标签并显示列表项
function listToLabel(anode, label) {
    const span = document.createElement('span');
    span.textContent = anode.textContent;
    label.appendChild(span);
    anode.classList.add('hidden');
    
    // 点击标签删除
    span.addEventListener('click', () => {
        span.remove();
        anode.classList.remove('hidden');
    });
}




// 关闭筛选弹窗获取选中的超市和商品
function closeFilter( marketLable, wareLable) {
    const marketNodes = marketLable.querySelectorAll('span');
    const wareNodes = wareLable.querySelectorAll('span');
    
    if (!marketNodes.length || !wareNodes.length) {
        return { markets: null, wares: null };
    }

    // 提取选择的超市和商品
    const markets = [];
    for (let span of marketNodes) {
        markets.push(span.innerHTML.split('#')[0]);
    }
    
    const wares = [];
    for (let span of wareNodes) {
        wares.push(span.innerHTML.split('#')[0]);
    }
    
    // 存储筛选条件到本地
    const filters = { markets, wares };
    localStorage.setItem('filters', JSON.stringify(filters));
    
    return { markets, wares };
}

export {LoadAndListenFilter, closeFilter}