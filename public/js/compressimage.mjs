// 图片压缩函数
async function compressImage(img, options = {}) {
    const { maxWidth = 800, maxHeight = 800, quality = 0.6 } = options;
    
    const bitmap = await createImageBitmap(img);
    
    let { width, height } = bitmap;
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
    }
    
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    bitmap.close();

    // 创建压缩后的文件
    const compressedFile = new File(
    [blob],
    `compressed_${img.name}`,
    { type: blob.type }
    );
    return compressedFile;
}
export {compressImage};