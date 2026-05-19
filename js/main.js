class ImageDigitizer {
    constructor() {
        this.originalImage = null;
        this.originalCanvas = document.getElementById('originalCanvas');
        this.processedCanvas = document.getElementById('processedCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.processedCtx = this.processedCanvas.getContext('2d');
        
        // コントロール要素
        this.resolutionSlider = document.getElementById('resolutionSlider');
        this.colorDepthSlider = document.getElementById('colorDepthSlider');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 表示要素
        this.resolutionValue = document.getElementById('resolutionValue');
        this.colorDepthValue = document.getElementById('colorDepthValue');
        
        // 情報表示要素
        this.originalInfo = document.getElementById('originalInfo');
        this.processedInfo = document.getElementById('processedInfo');
        
        // RGB表示要素
        this.colorPreview = document.getElementById('colorPreview');
        this.redValue = document.getElementById('redValue');
        this.greenValue = document.getElementById('greenValue');
        this.blueValue = document.getElementById('blueValue');
        this.hexValue = document.getElementById('hexValue');
        
        // データサイズ表示要素
        this.imageDimensions = document.getElementById('imageDimensions');
        this.totalPixels = document.getElementById('totalPixels');
        this.bitsPerPixel = document.getElementById('bitsPerPixel');
        this.dataSize = document.getElementById('dataSize');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // ファイルアップロード
        const imageInput = document.getElementById('imageInput');
        const uploadArea = document.getElementById('uploadArea');
        
        imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
        
        // ドラッグ&ドロップ
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });
        
        // クリックでファイル選択
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        // スライダーイベント
        this.resolutionSlider.addEventListener('input', () => {
            this.updateResolutionDisplay();
            this.processImage();
        });
        
        this.colorDepthSlider.addEventListener('input', () => {
            this.updateColorDepthDisplay();
            this.processImage();
        });
        
        // リセットボタン
        this.resetBtn.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // キャンバスクリックイベント（RGB値表示）
        this.originalCanvas.addEventListener('click', (e) => {
            this.showPixelRGB(e, this.originalCanvas, this.originalCtx);
        });
        
        this.processedCanvas.addEventListener('click', (e) => {
            this.showPixelRGB(e, this.processedCanvas, this.processedCtx);
        });
    }
    
    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください。');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage();
                this.processImage();
                this.showProcessingSection();
                this.updateDataInfo();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    displayOriginalImage() {
        const maxSize = 400;
        let { width, height } = this.originalImage;
        
        // アスペクト比を維持しながらリサイズ
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        this.originalCanvas.width = width;
        this.originalCanvas.height = height;
        
        this.originalCtx.drawImage(this.originalImage, 0, 0, width, height);
        
        this.originalInfo.textContent = `${this.originalImage.width} × ${this.originalImage.height} ピクセル`;
    }
    
    processImage() {
        if (!this.originalImage) return;
        
        const resolution = parseInt(this.resolutionSlider.value) / 100;
        const colorDepth = parseInt(this.colorDepthSlider.value);
        
        // 処理後のサイズを計算
        const originalWidth = this.originalCanvas.width;
        const originalHeight = this.originalCanvas.height;
        const newWidth = Math.max(1, Math.floor(originalWidth * resolution));
        const newHeight = Math.max(1, Math.floor(originalHeight * resolution));
        
        this.processedCanvas.width = originalWidth;
        this.processedCanvas.height = originalHeight;
        
        // 一時的なキャンバスでピクセル化処理
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        // 縮小して描画（ピクセル化効果）
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(this.originalCanvas, 0, 0, newWidth, newHeight);
        
        // 元のサイズに拡大
        this.processedCtx.imageSmoothingEnabled = false;
        this.processedCtx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight);
        
        // 色階調処理
        this.applyColorQuantization(colorDepth);
        
        this.processedInfo.textContent = `${newWidth} × ${newHeight} ピクセル (${colorDepth}段階)`;
        
        this.updateDataInfo();
    }
    
    applyColorQuantization(levels) {
        const imageData = this.processedCtx.getImageData(0, 0, this.processedCanvas.width, this.processedCanvas.height);
        const data = imageData.data;
        
        const step = 256 / levels;
        
        for (let i = 0; i < data.length; i += 4) {
            // RGB値を量子化
            data[i] = Math.floor(data[i] / step) * step;     // R
            data[i + 1] = Math.floor(data[i + 1] / step) * step; // G
            data[i + 2] = Math.floor(data[i + 2] / step) * step; // B
            // アルファ値はそのまま
        }
        
        this.processedCtx.putImageData(imageData, 0, 0);
    }
    
    showPixelRGB(event, canvas, ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(event.clientX - rect.left);
        const y = Math.floor(event.clientY - rect.top);
        
        // キャンバスの実際のピクセル座標に変換
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pixelX = Math.floor(x * scaleX);
        const pixelY = Math.floor(y * scaleY);
        
        if (pixelX < 0 || pixelX >= canvas.width || pixelY < 0 || pixelY >= canvas.height) {
            return;
        }
        
        const imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
        const pixel = imageData.data;
        
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        
        // RGB値表示
        this.redValue.textContent = r;
        this.greenValue.textContent = g;
        this.blueValue.textContent = b;
        
        // HEX値表示
        const hex = '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        this.hexValue.textContent = hex;
        
        // カラープレビュー
        this.colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
    
    updateResolutionDisplay() {
        const value = this.resolutionSlider.value;
        this.resolutionValue.textContent = `${value}%`;
    }
    
    updateColorDepthDisplay() {
        const value = this.colorDepthSlider.value;
        this.colorDepthValue.textContent = `${value}段階`;
        
        // ビット数も更新
        const bitsPerChannel = Math.ceil(Math.log2(value));
        const totalBits = bitsPerChannel * 3; // RGB
        this.bitsPerPixel.textContent = `${totalBits}ビット (RGB各${bitsPerChannel}ビット)`;
    }
    
    updateDataInfo() {
        if (!this.originalImage) return;
        
        const width = this.originalImage.width;
        const height = this.originalImage.height;
        const totalPixels = width * height;
        
        // 現在の設定でのデータサイズ計算
        const colorDepth = parseInt(this.colorDepthSlider.value);
        const bitsPerChannel = Math.ceil(Math.log2(colorDepth));
        const bitsPerPixel = bitsPerChannel * 3;
        const totalBits = totalPixels * bitsPerPixel;
        const totalBytes = totalBits / 8;
        
        // 解像度による影響も考慮
        const resolution = parseInt(this.resolutionSlider.value) / 100;
        const effectivePixels = Math.floor(totalPixels * resolution * resolution);
        const effectiveBytes = effectivePixels * bitsPerPixel / 8;
        
        this.imageDimensions.textContent = `${width} × ${height}`;
        this.totalPixels.textContent = totalPixels.toLocaleString();
        
        // データサイズを適切な単位で表示
        let sizeText;
        if (effectiveBytes > 1024 * 1024) {
            sizeText = `${(effectiveBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (effectiveBytes > 1024) {
            sizeText = `${(effectiveBytes / 1024).toFixed(2)} KB`;
        } else {
            sizeText = `${effectiveBytes.toFixed(0)} バイト`;
        }
        
        this.dataSize.textContent = sizeText;
    }
    
    resetSettings() {
        this.resolutionSlider.value = 100;
        this.colorDepthSlider.value = 256;
        this.updateResolutionDisplay();
        this.updateColorDepthDisplay();
        if (this.originalImage) {
            this.processImage();
        }
        
        // RGB表示をリセット
        this.redValue.textContent = '-';
        this.greenValue.textContent = '-';
        this.blueValue.textContent = '-';
        this.hexValue.textContent = '-';
        this.colorPreview.style.backgroundColor = '#fff';
    }
    
    showProcessingSection() {
        const section = document.getElementById('processingSection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new ImageDigitizer();
    
    // 初期表示値の設定
    document.getElementById('resolutionValue').textContent = '100%';
    document.getElementById('colorDepthValue').textContent = '256段階';
});

// サンプル画像読み込み機能
function loadSampleImage() {
    // サンプル画像を作成（グラデーション）
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // カラフルなグラデーション作成
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.2, '#ff8000');
    gradient.addColorStop(0.4, '#ffff00');
    gradient.addColorStop(0.6, '#00ff00');
    gradient.addColorStop(0.8, '#0080ff');
    gradient.addColorStop(1, '#8000ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 円を描画
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(150, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sample', 150, 110);
    
    // Canvasから画像を作成
    canvas.toBlob((blob) => {
        const imageDigitizer = window.imageDigitizer;
        if (imageDigitizer) {
            const file = new File([blob], 'sample.png', { type: 'image/png' });
            imageDigitizer.handleImageUpload(file);
        }
    });
}

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('エラーが発生しました:', e.error);
});

// パフォーマンス最適化：デバウンス機能
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// スライダーのパフォーマンス最適化
document.addEventListener('DOMContentLoaded', () => {
    const resolutionSlider = document.getElementById('resolutionSlider');
    const colorDepthSlider = document.getElementById('colorDepthSlider');
    
    if (resolutionSlider && colorDepthSlider) {
        // デバウンス処理でパフォーマンスを向上
        const debouncedProcess = debounce(() => {
            if (window.imageDigitizer && window.imageDigitizer.originalImage) {
                window.imageDigitizer.processImage();
            }
        }, 100);
        
        resolutionSlider.addEventListener('input', debouncedProcess);
        colorDepthSlider.addEventListener('input', debouncedProcess);
    }
});

// ユーティリティ関数
const ImageUtils = {
    // 画像品質の評価
    calculateImageQuality: function(originalCanvas, processedCanvas) {
        // 簡単なPSNR（Peak Signal-to-Noise Ratio）計算
        const original = originalCanvas.getContext('2d').getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const processed = processedCanvas.getContext('2d').getImageData(0, 0, processedCanvas.width, processedCanvas.height);
        
        let mse = 0;
        const totalPixels = original.data.length / 4;
        
        for (let i = 0; i < original.data.length; i += 4) {
            const rDiff = original.data[i] - processed.data[i];
            const gDiff = original.data[i + 1] - processed.data[i + 1];
            const bDiff = original.data[i + 2] - processed.data[i + 2];
            
            mse += (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) / 3;
        }
        
        mse /= totalPixels;
        
        if (mse === 0) return Infinity;
        const psnr = 10 * Math.log10((255 * 255) / mse);
        return psnr;
    },
    
    // 色の距離計算
    colorDistance: function(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
    },
    
    // RGB to HSV変換
    rgbToHsv: function(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff) % 6;
            } else if (max === g) {
                h = (b - r) / diff + 2;
            } else {
                h = (r - g) / diff + 4;
            }
            h *= 60;
            if (h < 0) h += 360;
        }
        
        const s = max === 0 ? 0 : diff / max;
        const v = max;
        
        return [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
    }
};