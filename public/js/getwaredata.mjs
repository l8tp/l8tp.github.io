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
export {fetchWareData};