// 图片压缩函数（裁剪为正方形）
async function compressImage(img, options = {}) {
    const { maxSize = 600, quality = 0.6 } = options;
    
    const bitmap = await createImageBitmap(img);
    
    // 计算中心裁剪区域（取短边）
    const size = Math.min(bitmap.width, bitmap.height);
    const startX = (bitmap.width - size) / 2;
    const startY = (bitmap.height - size) / 2;
    
    // 创建正方形 Canvas 并绘制
    const canvas = new OffscreenCanvas(maxSize, maxSize);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, startX, startY, size, size, 0, 0, maxSize, maxSize);
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    bitmap.close();
    
    return new File([blob], `compressed_${img.name}`, { type: blob.type });
}
export {compressImage};