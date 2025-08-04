// Camera utilities for prescription capture
export interface CameraCapture {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export const getCameraConstraints = (facingMode: 'user' | 'environment' = 'environment') => ({
  video: {
    facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: { ideal: 4/3 }
  },
  audio: false
});

export const startCameraStream = async (
  videoElement: HTMLVideoElement, 
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> => {
  try {
    const constraints = getCameraConstraints(facingMode);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    videoElement.srcObject = stream;
    videoElement.play();
    
    return stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
  }
};

export const stopCameraStream = (stream: MediaStream): void => {
  stream.getTracks().forEach(track => track.stop());
};

export const captureFromCamera = async (videoElement: HTMLVideoElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw video frame to canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Impossible de créer l\'image'));
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      reject(error);
    }
  });
};

export const captureWithEnhancements = async (
  videoElement: HTMLVideoElement,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<CameraCapture> => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      let { videoWidth: width, videoHeight: height } = videoElement;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Apply image enhancements for better prescription readability
      context.filter = 'contrast(1.2) brightness(1.1) saturate(1.1)';
      context.drawImage(videoElement, 0, 0, width, height);

      // Convert to blob and data URL
      canvas.toBlob((blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL(`image/${format}`, quality);
          resolve({
            blob,
            dataUrl,
            width,
            height
          });
        } else {
          reject(new Error('Impossible de créer l\'image'));
        }
      }, `image/${format}`, quality);
    } catch (error) {
      reject(error);
    }
  });
};

export const validatePrescriptionImage = (blob: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    // Basic validation - check file size and type
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (blob.size > maxSize) {
      resolve(false);
      return;
    }

    if (!allowedTypes.includes(blob.type)) {
      resolve(false);
      return;
    }

    // Additional validation could include:
    // - Image dimensions check
    // - Blur detection
    // - Text detection using OCR
    // - Prescription format validation

    resolve(true);
  });
};

export const compressImage = (
  blob: Blob, 
  maxSizeKB: number = 1024
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      // Calculate new dimensions to reduce file size
      let { width, height } = img;
      const maxDimension = 1200;
      
      if (width > maxDimension || height > maxDimension) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxDimension;
          height = width / aspectRatio;
        } else {
          height = maxDimension;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels until we get under the size limit
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((compressedBlob) => {
          if (compressedBlob) {
            if (compressedBlob.size <= maxSizeKB * 1024 || quality <= 0.1) {
              resolve(compressedBlob);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', quality);
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Invalid image'));
    img.src = URL.createObjectURL(blob);
  });
};

// Check camera permissions
export const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    if (!navigator.permissions) {
      // Fallback: try to access camera directly
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }

    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state === 'granted';
  } catch (error) {
    return false;
  }
};

// Request camera permissions
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};
