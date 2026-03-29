// 启动编辑弹窗
function editAndListen(compressImage, market, ware, td, editNode, bottomTabBarNode, API_URL, currentToken, userIdTemp) {
    
    // 编辑弹窗赋值
    let price, unit, imgSrc, theImg;
    
    if (td.innerHTML) {
        price = td.querySelector('.price').textContent;
        unit = td.querySelector('.unit').textContent;
        const wareImg = td.querySelector('.wareImg');
        if(wareImg){
            imgSrc = wareImg.href;
            if(!imgSrc){
                imgSrc = wareImg.querySelector('img').src;
            }
        }
    }
    
    const priceInput = editNode.querySelector('#priceInput');
    const unitText = editNode.querySelector('#unit');
    const imgContainer = editNode.querySelector('#editImgContainer');
    const editWareImg = imgContainer.querySelector('img');

    editNode.querySelector('label').textContent = `${market}：${ware}`;
    priceInput.value = price || '';
    unitText.textContent = (unit || '元/斤') + ' ▼';
    if(imgSrc){
        imgContainer.classList.remove('hidden');
        editWareImg.src = imgSrc;
    }else{
        imgContainer.classList.add('hidden')
    }

    if (editNode.dataset.loading) return;
    editNode.dataset.loading = true;

    const imgInput = editNode.querySelector('#imgInput');
    const submitButton = editNode.querySelector('#submitEdit');
    // 监听关闭按钮
    editNode.querySelector('.Xwinpop').addEventListener('click', () => {
        editNode.classList.add('hidden');
    });
    
    //监听输入框焦点事件，隐藏底部导航栏
    const inputs = editNode.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            bottomTabBarNode.classList.add('hidden');
        });
        
        input.addEventListener('blur', () => {
            bottomTabBarNode.classList.remove('hidden');
        });
    });

    // 监听图片输入
    imgInput.addEventListener('change', async (e)=>{
        const img = e.target.files[0];
        if(!img) return;

        imgContainer.classList.remove('hidden');
        const imgSize = imgContainer.querySelector('p');
        // 压缩图片
        const compressedFile = await compressImage(img);
        imgSize.textContent = `${(compressedFile.size / 1024).toFixed(2)} KB`
        theImg = compressedFile;
        // 显示图片
        editWareImg.src = URL.createObjectURL(compressedFile);
    });
    //监听上传按钮
    submitButton.addEventListener('click', async (e) => {
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = '正在提交...';
        btn.disabled = true;

        const newPrice = priceInput.value;
        const newUnit = unitText.textContent.split(' ')[0];

        const formData = new FormData();
        formData.append('image', theImg);
        formData.append('jsonData', JSON.stringify({
            token:currentToken, 
            userIdTemp, 
            marketInput:market, 
            wareInput:ware, 
            priceInput:newPrice, 
            unit:newUnit 
        }));
        
        try {
            const response = await fetch(`${API_URL}/products/user/submitprice`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('修改成功');
                location.reload();
            } else {
                handleError(result.message);
            }
        } catch (error) {
            console.error('提交价格失败:', error);
            alert('请求服务器错误');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    return theImg;
}
export { editAndListen };