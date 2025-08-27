import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { captureFromCamera } from "@/lib/camera";

export default function Camera() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erreur de caméra",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const uploadPrescriptionMutation = useMutation({
    mutationFn: async (imageBlob: Blob) => {
      const formData = new FormData();
      formData.append('prescription', imageBlob, 'prescription.jpg');
      return apiRequest('/api/prescriptions', 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: "Photo capturée",
        description: "Photo sauvegardée avec succès",
      });
      // Ne pas rediriger automatiquement - laisser l'utilisateur continuer
      goBack();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la photo",
        variant: "destructive",
      });
    },
  });

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    try {
      const imageBlob = await captureFromCamera(videoRef.current);
      uploadPrescriptionMutation.mutate(imageBlob);
    } catch (error) {
      toast({
        title: "Erreur de capture",
        description: "Impossible de prendre la photo",
        variant: "destructive",
      });
    }
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
    // Note: Flash control is limited in web browsers
    // This would typically require native app functionality
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50"
            data-testid="button-back"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Button>
          <h2 className="text-white font-semibold" data-testid="text-camera-title">
            Scanner l'ordonnance
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFlash}
            className={`w-10 h-10 backdrop-blur-sm rounded-full text-white hover:bg-white/30 ${isFlashOn ? 'bg-white/30' : 'bg-black/30'}`}
            data-testid="button-flash"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            data-testid="video-camera-preview"
          />
        ) : (
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium mb-2">Caméra en cours de chargement...</p>
            <p className="text-white/70 text-sm">Préparation de la capture</p>
          </div>
        )}
      </div>

      {/* Camera Overlay Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-60 border-4 border-white rounded-2xl border-dashed opacity-50"></div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center space-x-8">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"
            data-testid="button-gallery"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </Button>
          
          <Button
            onClick={capturePhoto}
            disabled={uploadPrescriptionMutation.isPending}
            className="w-20 h-20 bg-white rounded-full hover:bg-gray-100 shadow-lg"
            data-testid="button-capture"
          >
            <div className="w-16 h-16 bg-pharma-green rounded-full flex items-center justify-center">
              {uploadPrescriptionMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"
            data-testid="button-switch-camera"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
            </svg>
          </Button>
        </div>
        <p className="text-white text-center mt-4 text-sm" data-testid="text-camera-instruction">
          Positionnez l'ordonnance dans le cadre
        </p>
      </div>
    </div>
  );
}
