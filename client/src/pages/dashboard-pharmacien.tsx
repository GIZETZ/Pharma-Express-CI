import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

// Composant pour gérer les candidatures de livreurs
function DeliveryApplicationsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ["/api/pharmacien/delivery-applications"],
    enabled: true,
    queryFn: async () => {
      console.log('🔄 Fetching delivery applications...');
      const response = await fetch("/api/pharmacien/delivery-applications", {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch applications:', response.status, errorText);
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }
      const data = await response.json();
      console.log('📬 Applications received:', data);
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 3
  });

  const respondToApplicationMutation = useMutation({
    mutationFn: ({ applicationId, action }: { applicationId: string; action: string }) =>
      apiRequest(`/api/pharmacien/delivery-applications/${applicationId}/respond`, "POST", { action }),
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? "Candidature acceptée" : "Candidature rejetée",
        description: variables.action === 'approve'
          ? "Le livreur peut maintenant accéder à son tableau de bord"
          : "Le livreur a été notifié du rejet",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/delivery-applications"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la candidature",
        variant: "destructive",
      });
    },
  });

  const handleRespondToApplication = (applicationId: string, action: string) => {
    respondToApplicationMutation.mutate({ applicationId, action });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="ml-2 text-gray-600">Chargement des candidatures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-red-600 mb-4">
            Impossible de charger les candidatures: {error.message}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/delivery-applications"] })}
            variant="outline"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!applications || applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              🚴
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Aucune candidature en attente
            </h3>
            <p className="text-gray-500">
              Les candidatures de livreurs apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        applications.map((application: any) => (
          <Card key={application.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {application.firstName} {application.lastName}
                </CardTitle>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Candidature
                </Badge>
              </div>
              <CardDescription>
                Souhaite rejoindre votre équipe de livraison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                  <p className="text-sm">{application.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Adresse</Label>
                  <p className="text-sm">{application.address}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Statut de vérification</Label>
                <Badge variant={application.verificationStatus === 'approved' ? 'default' : 'destructive'} className="ml-2">
                  {application.verificationStatus === 'approved' ? 'Vérifié' : 'En attente'}
                </Badge>
              </div>

              {/* Informations de candidature */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-600 mb-2 block">Informations de candidature</Label>
                <div className="space-y-3">
                  {application.motivationLetter && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="font-medium text-blue-900 mb-2">💬 Lettre de motivation</h5>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{application.motivationLetter}</p>
                    </div>
                  )}

                  {application.experience && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-medium text-green-900 mb-2">💼 Expérience professionnelle</h5>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{application.experience}</p>
                    </div>
                  )}

                  {application.availability && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h5 className="font-medium text-purple-900 mb-2">⏰ Disponibilités</h5>
                      <p className="text-sm text-purple-800 whitespace-pre-wrap">{application.availability}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents fournis par le candidat */}
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-2 block">Documents fournis</Label>
                <div className="grid grid-cols-1 gap-2">
                  {application.idDocumentUrl && (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">📄</span>
                        <span className="text-sm font-medium text-green-800">Carte d'identité</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 hover:text-green-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Détecter si c'est une image ou un document
                            const isImage = application.idDocumentUrl.startsWith('data:image/');

                            if (isImage) {
                              // Afficher l'image dans une modal
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
                              modal.style.zIndex = '9999';
                              modal.style.cursor = 'pointer';

                              const modalContent = document.createElement('div');
                              modalContent.className = 'relative max-w-full max-h-full';
                              modalContent.innerHTML = `
                                <img src="${application.idDocumentUrl}"
                                     class="max-w-full max-h-full object-contain"
                                     alt="Carte d'identité de ${application.firstName} ${application.lastName}" />
                                <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
                              `;

                              modal.appendChild(modalContent);

                              const closeModal = () => {
                                try {
                                  if (modal && document.body.contains(modal)) {
                                    document.body.removeChild(modal);
                                  }
                                } catch (error) {
                                  console.log('Modal already removed');
                                }
                              };

                              modalContent.addEventListener('click', (e) => e.stopPropagation());
                              const closeBtn = modalContent.querySelector('button');
                              closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
                              modal.addEventListener('click', closeModal);

                              const handleEscape = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  closeModal();
                                  document.removeEventListener('keydown', handleEscape);
                                }
                              };
                              document.addEventListener('keydown', handleEscape);

                              document.body.appendChild(modal);
                            } else {
                              // Télécharger le document
                              const link = document.createElement('a');
                              link.href = application.idDocumentUrl;
                              link.download = `Carte_identite_${application.firstName}_${application.lastName}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          👁️ Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 hover:text-green-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Télécharger le document
                            const link = document.createElement('a');
                            link.href = application.idDocumentUrl;
                            link.download = `Carte_identite_${application.firstName}_${application.lastName}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          📥 Télécharger
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.drivingLicenseUrl && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">🚗</span>
                        <span className="text-sm font-medium text-blue-800">Permis de conduire</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-700 hover:text-blue-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Détecter si c'est une image ou un document
                            const isImage = application.drivingLicenseUrl.startsWith('data:image/');

                            if (isImage) {
                              // Afficher l'image dans une modal
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
                              modal.style.zIndex = '9999';
                              modal.style.cursor = 'pointer';

                              const modalContent = document.createElement('div');
                              modalContent.className = 'relative max-w-full max-h-full';
                              modalContent.innerHTML = `
                                <img src="${application.drivingLicenseUrl}"
                                     class="max-w-full max-h-full object-contain"
                                     alt="Permis de conduire de ${application.firstName} ${application.lastName}" />
                                <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
                              `;

                              modal.appendChild(modalContent);

                              const closeModal = () => {
                                try {
                                  if (modal && document.body.contains(modal)) {
                                    document.body.removeChild(modal);
                                  }
                                } catch (error) {
                                  console.log('Modal already removed');
                                }
                              };

                              modalContent.addEventListener('click', (e) => e.stopPropagation());
                              const closeBtn = modalContent.querySelector('button');
                              closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
                              modal.addEventListener('click', closeModal);

                              const handleEscape = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  closeModal();
                                  document.removeEventListener('keydown', handleEscape);
                                }
                              };
                              document.addEventListener('keydown', handleEscape);

                              document.body.appendChild(modal);
                            } else {
                              // Télécharger le document
                              const link = document.createElement('a');
                              link.href = application.drivingLicenseUrl;
                              link.download = `Permis_conduire_${application.firstName}_${application.lastName}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          👁️ Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-700 hover:text-blue-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Télécharger le document
                            const link = document.createElement('a');
                            link.href = application.drivingLicenseUrl;
                            link.download = `Permis_conduire_${application.firstName}_${application.lastName}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          📥 Télécharger
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.professionalDocumentUrl && (
                    <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600">📝</span>
                        <span className="text-sm font-medium text-purple-800">CV / Document professionnel</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-700 hover:text-purple-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Détecter si c'est une image ou un document
                            const isImage = application.professionalDocumentUrl.startsWith('data:image/');

                            if (isImage) {
                              // Afficher l'image dans une modal
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
                              modal.style.zIndex = '9999';
                              modal.style.cursor = 'pointer';

                              const modalContent = document.createElement('div');
                              modalContent.className = 'relative max-w-full max-h-full';
                              modalContent.innerHTML = `
                                <img src="${application.professionalDocumentUrl}"
                                     class="max-w-full max-h-full object-contain"
                                     alt="CV de ${application.firstName} ${application.lastName}" />
                                <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
                              `;

                              modal.appendChild(modalContent);

                              const closeModal = () => {
                                try {
                                  if (modal && document.body.contains(modal)) {
                                    document.body.removeChild(modal);
                                  }
                                } catch (error) {
                                  console.log('Modal already removed');
                                }
                              };

                              modalContent.addEventListener('click', (e) => e.stopPropagation());
                              const closeBtn = modalContent.querySelector('button');
                              closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
                              modal.addEventListener('click', closeModal);

                              const handleEscape = (e: KeyboardEvent) => {
                                if (e.key === 'Escape') {
                                  closeModal();
                                  document.removeEventListener('keydown', handleEscape);
                                }
                              };
                              document.addEventListener('keydown', handleEscape);

                              document.body.appendChild(modal);
                            } else {
                              // Télécharger le document
                              const link = document.createElement('a');
                              link.href = application.professionalDocumentUrl;
                              link.download = `CV_${application.firstName}_${application.lastName}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          👁️ Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-700 hover:text-purple-800"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Télécharger le document
                            const link = document.createElement('a');
                            link.href = application.professionalDocumentUrl;
                            link.download = `CV_${application.firstName}_${application.lastName}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          📥 Télécharger
                        </Button>
                      </div>
                    </div>
                  )}

                  {!application.idDocumentUrl && !application.drivingLicenseUrl && !application.professionalDocumentUrl && (
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
                      <span className="text-sm text-gray-500">Aucun document fourni</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={() => handleRespondToApplication(application.id, 'approve')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={respondToApplicationMutation.isPending}
                >
                  ✅ Accepter
                </Button>
                <Button
                  onClick={() => handleRespondToApplication(application.id, 'reject')}
                  variant="destructive"
                  className="flex-1"
                  disabled={respondToApplicationMutation.isPending}
                >
                  ❌ Rejeter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// Component to fetch and display patient information
const PatientInfo = ({ order }: { order: any }) => {
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (order.user?.firstName) {
        // Si les données utilisateur sont déjà présentes
        setPatientData(order.user);
        setLoading(false);
        return;
      }

      if (!order.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${order.userId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setPatientData(userData);
        } else {
          console.error('Failed to fetch patient data');
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [order.userId, order.user]);

  if (loading) {
    return (
      <span className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        Chargement des informations patient...
      </span>
    );
  }

  if (patientData?.firstName) {
    return (
      <span>
        Patient: {patientData.firstName} {patientData.lastName || ''} • {patientData.phone || 'Téléphone non disponible'}
      </span>
    );
  }

  // Essayer les champs directs de la commande
  if (order.patientName || order.customerName) {
    const patientName = order.patientName || order.customerName;
    const phone = order.patientPhone || order.customerPhone || order.phone || 'Téléphone non disponible';
    return <span>Patient: {patientName} • {phone}</span>;
  }

  // Si on a juste un téléphone
  if (order.phone) {
    return <span>Patient: Téléphone {order.phone}</span>;
  }

  // Fallback avec ID
  if (order.userId) {
    return <span>Patient: ID {order.userId.slice(0, 8)} • Informations non disponibles</span>;
  }

  return <span>Patient: Informations non disponibles</span>;
};

// Component to display prescription image
const PrescriptionImage = ({ prescriptionId, className }: { prescriptionId: string, className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await apiRequest(`/api/prescriptions/${prescriptionId}`, 'GET');
        const prescription = await response.json();
        setImageUrl(prescription.imageUrl);
      } catch (error) {
        console.error('Error fetching prescription:', error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [prescriptionId]);

  const openImageModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageUrl) return;

    // Créer la modal avec de meilleurs styles
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4';
    modal.style.zIndex = '99999';
    modal.style.cursor = 'zoom-out';

    const modalContent = document.createElement('div');
    modalContent.className = 'relative flex items-center justify-center max-w-[95vw] max-h-[95vh]';
    modalContent.style.cursor = 'auto';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Photo de l\'ordonnance';
    img.className = 'max-w-full max-h-full object-contain rounded-lg shadow-2xl';
    img.style.cursor = 'zoom-out';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'absolute -top-12 right-0 text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all duration-200 shadow-lg';
    closeBtn.style.cursor = 'pointer';
    closeBtn.title = 'Fermer (Échap)';

    modalContent.appendChild(img);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);

    const closeModal = () => {
      try {
        if (modal && document.body.contains(modal)) {
          modal.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
            }
          }, 200);
        }
      } catch (error) {
        console.log('Modal already removed');
      }
    };

    // Empêcher la fermeture quand on clique sur l'image
    modalContent.addEventListener('click', (e) => e.stopPropagation());

    // Fermer avec le bouton X
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    // Fermer en cliquant sur le fond
    modal.addEventListener('click', closeModal);

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Animation d'entrée
    modal.style.opacity = '0';
    document.body.appendChild(modal);
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.transition = 'opacity 0.2s ease-in-out';
    }, 10);
  };

  if (loading) {
    return (
      <div className={`${className || 'w-full h-64'} flex items-center justify-center bg-gray-100 rounded-lg border`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className || 'w-full h-64'} flex flex-col items-center justify-center bg-gray-100 text-gray-500 rounded-lg border`}>
        <span className="text-4xl mb-2">📄</span>
        <p className="text-sm font-medium">Image non disponible</p>
        <p className="text-xs text-gray-400 mt-1">L'ordonnance n'a pas pu être chargée</p>
      </div>
    );
  }

  return (
    <div className="relative group inline-block">
      <img
        src={imageUrl}
        alt="Photo de l'ordonnance"
        className={`${className || 'max-w-full h-auto'} cursor-pointer rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 group-hover:brightness-95 block`}
        onClick={openImageModal}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Component for handling ready-for-delivery orders
const ReadyForDeliveryOrders = ({ orders }: { orders: any[] }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch delivery personnel
  const { data: deliveryPersonnel, isLoading: personnelLoading } = useQuery({
    queryKey: ['/api/pharmacien/delivery-personnel'],
    enabled: true
  });

  // Assign delivery person mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, deliveryPersonId }: { orderId: string, deliveryPersonId: string }) => {
      const response = await apiRequest(`/api/pharmacien/orders/${orderId}/assign-delivery`, 'POST', {
        deliveryPersonId
      });
      if (!response.ok) {
        throw new Error('Failed to assign delivery person');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacien/orders'] });
      toast({
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès à cette commande",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner le livreur",
        variant: "destructive",
      });
    }
  });

  const readyOrders = orders?.filter((order: any) => order.status === 'ready_for_delivery') || [];

  if (readyOrders.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <div className="text-gray-400 mb-2">📦</div>
        <h4 className="font-medium text-gray-700 mb-2">Aucune commande prête pour livraison</h4>
        <p className="text-sm text-gray-600">
          Les commandes prêtes apparaîtront ici pour que vous puissiez assigner un livreur
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">ℹ️</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Gestion des Livraisons</h4>
            <p className="text-sm text-blue-700">
              Choisissez le livreur que vous souhaitez pour chaque commande.
              Une fois assigné, le livreur recevra une notification et pourra commencer la livraison.
            </p>
          </div>
        </div>
      </div>

      {readyOrders.map((order: any) => (
        <div key={order.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-green-900">Commande #{order.id.slice(0, 8)}</h4>
              <p className="text-sm text-green-700">
                Patient: {order.user?.firstName} {order.user?.lastName} • {order.user?.phone}
              </p>
            </div>
            <Badge className="bg-green-600 text-white">Prête pour livraison</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Montant total</p>
              <p className="text-lg font-bold text-green-600">{(() => {
                if (order.totalAmount && order.totalAmount !== '0' && order.totalAmount !== '0.00') {
                  return `${parseFloat(order.totalAmount).toFixed(0)} FCFA`;
                }
                // Calculer le total à partir des médicaments si disponible
                try {
                  const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : (order.medications || []);
                  const total = medications.reduce((sum: number, med: any) => {
                    const price = parseFloat(med.price) || 0;
                    const isAvailable = med.available !== false;
                    return sum + (price > 0 && isAvailable ? price : 0);
                  }, 0);
                  return total > 0 ? `${total.toFixed(0)} FCFA` : 'En cours d\'évaluation';
                } catch (error) {
                  console.error('Error calculating total for ready order:', error);
                  return 'En cours d\'évaluation';
                }
              })()}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Date de commande</p>
              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          <div className="mb-4 bg-white rounded-lg p-3 border border-green-200">
            <p className="text-sm font-medium text-gray-700 mb-1">📍 Adresse de livraison</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>

          {/* Delivery assignment section */}
          {order.deliveryPersonId ? (
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    🚴
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">✅ Livreur assigné avec succès</p>
                    <p className="text-sm text-gray-600">
                      <strong>
                        {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.firstName} {' '}
                        {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.lastName}
                      </strong>
                      {' • '}
                      {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.phone}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  🚚 En cours de livraison
                </Badge>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <Label className="text-sm font-medium text-orange-900">
                    🔔 Choisir et assigner un livreur
                  </Label>
                  <p className="text-xs text-orange-700 mt-1">
                    Sélectionnez le livreur que vous souhaitez pour chaque commande.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={(deliveryPersonId) => {
                    assignDeliveryMutation.mutate({ orderId: order.id, deliveryPersonId });
                  }}
                  disabled={assignDeliveryMutation.isPending || personnelLoading}
                >
                  <SelectTrigger className="flex-1 border-orange-300 focus:border-orange-500">
                    <SelectValue placeholder="Sélectionner un livreur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryPersonnel?.map((person: any) => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <span>🚴</span>
                            <span>{person.firstName} {person.lastName}</span>
                            <span className="text-gray-500">• {person.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              {person.dailyOrderCount || 0} cmd/jour
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignDeliveryMutation.isPending && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                )}
              </div>

              {personnelLoading && (
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                  Chargement des livreurs disponibles...
                </p>
              )}
              {!personnelLoading && (!deliveryPersonnel || deliveryPersonnel.length === 0) && (
                <p className="text-xs text-red-500 mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  Aucun livreur disponible pour le moment
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPharmacien() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [medicationStatuses, setMedicationStatuses] = useState<Record<string, {available: boolean, surBon: boolean}>>({});
  const [visibleImages, setVisibleImages] = useState<Record<string, boolean>>({});
  const [medicationPrices, setMedicationPrices] = useState<Record<string, string>>({});
  const [newMedication, setNewMedication] = useState({ name: '', price: '', surBon: false });
  const [orderMedications, setOrderMedications] = useState<Record<string, any[]>>({});
  const [editingMedication, setEditingMedication] = useState<Record<string, boolean>>({});
  const [medicationNames, setMedicationNames] = useState<Record<string, string>>({});

  // États pour l'authentification des paramètres
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Mutation pour mettre à jour le statut des commandes
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest(`/api/pharmacien/orders/${orderId}/status`, "POST", { status }),
    onSuccess: (data, variables) => {
      toast({
        title: "Commande mise à jour",
        description: `Commande ${variables.status === 'confirmed' ? 'validée' : variables.status === 'rejected' ? 'rejetée' : 'mise à jour'} avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour les médicaments
  const updateMedicationsMutation = useMutation({
    mutationFn: ({ orderId, medications }: { orderId: string; medications: any[] }) =>
      apiRequest(`/api/pharmacien/orders/${orderId}/medications`, "POST", { medications }),
    onSuccess: () => {
      toast({
        title: "Médicaments mis à jour",
        description: "Les informations des médicaments ont été sauvegardées",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les médicaments",
        variant: "destructive",
      });
    },
  });

  // Mutation pour envoyer la réponse au patient
  const sendResponseMutation = useMutation({
    mutationFn: ({ orderId, medications }: { orderId: string; medications: any[] }) =>
      apiRequest(`/api/pharmacien/orders/${orderId}/send-response`, "POST", { medications }),
    onSuccess: (data, variables) => {
      toast({
        title: "Réponse envoyée",
        description: "La réponse a été envoyée au patient avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });

      // Ne réinitialiser que les données de la commande spécifique qui a été traitée
      const { orderId } = variables;
      setMedicationPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(orderId)) {
            delete updated[key];
          }
        });
        return updated;
      });
      setMedicationStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(orderId)) {
            delete updated[key];
          }
        });
        return updated;
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/pharmacien/orders"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/pharmacien/prescriptions"],
    refetchInterval: 5000
  });
  // Fetch pharmacy data to potentially get pharmacy names
  const { data: pharmacies } = useQuery({
    queryKey: ["/api/pharmacies"],
    enabled: true
  });

  // Function to get prescription image
  const getPrescriptionImage = async (prescriptionId: string) => {
    try {
      const response = await apiRequest(`/api/prescriptions/${prescriptionId}`, 'GET');
      return response.imageUrl;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  };

  const handleOrderUpdate = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const handleMedicationUpdate = (orderId: string, medications: any[]) => {
    updateMedicationsMutation.mutate({ orderId, medications });
  };

  const toggleMedicationStatus = (orderId: string, medIndex: number, field: 'available' | 'surBon', value: boolean) => {
    const key = `${orderId}-${medIndex}`;
    setMedicationStatuses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const updateMedicationPrice = (orderId: string, medIndex: number, price: string) => {
    const key = `${orderId}-${medIndex}`;
    setMedicationPrices(prev => ({
      ...prev,
      [key]: price
    }));
  };

  // Fonction pour ajouter un nouveau médicament à une commande
  const addMedicationToOrder = (orderId: string) => {
    if (!newMedication.name.trim() || !newMedication.price) {
      toast({
        title: "Validation requise",
        description: "Veuillez saisir le nom et le prix du médicament",
        variant: "destructive",
      });
      return;
    }

    // Ajouter le médicament à la liste locale pour cette commande
    setOrderMedications(prev => {
      const currentMeds = prev[orderId] || [];
      return {
        ...prev,
        [orderId]: [...currentMeds, {
          name: newMedication.name,
          price: newMedication.price,
          surBon: newMedication.surBon,
          available: true
        }]
      };
    });

    // Réinitialiser le formulaire
    setNewMedication({ name: '', price: '', surBon: false });

    toast({
      title: "Médicament ajouté",
      description: `${newMedication.name} a été ajouté à la commande`,
    });
  };

  // Fonction pour supprimer un médicament ajouté par le pharmacien
  const removePharmaticistMedication = (orderId: string, index: number) => {
    setOrderMedications(prev => {
      const currentMeds = prev[orderId] || [];
      const updatedMeds = currentMeds.filter((_, i) => i !== index);
      return {
        ...prev,
        [orderId]: updatedMeds
      };
    });

    toast({
      title: "Médicament supprimé",
      description: "Le médicament a été retiré de la commande",
    });
  };

  // Fonction pour modifier le nom d'un médicament patient
  const updateMedicationName = (orderId: string, medIndex: number, newName: string, isPatientMed: boolean = true) => {
    const key = isPatientMed ? `${orderId}-${medIndex}` : `pharmacist-${orderId}-${medIndex}`;
    setMedicationNames(prev => ({
      ...prev,
      [key]: newName
    }));
  };

  // Fonction pour basculer le mode d'édition d'un médicament
  const toggleEditMode = (statusKey: string) => {
    setEditingMedication(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }));
  };

  // Fonction pour vérifier le mot de passe avant l'accès aux paramètres
  const verifyPasswordForSettings = async (password: string) => {
    try {
      setIsVerifying(true);

      // Vérifier le mot de passe en tentant une connexion temporaire
      const response = await apiRequest('/api/auth/verify-password', 'POST', {
        phone: user?.phone,
        password: password
      });

      if (!response.ok) {
        throw new Error('Mot de passe incorrect');
      }

      return true;
    } catch (error) {
      throw new Error('Mot de passe incorrect');
    } finally {
      setIsVerifying(false);
    }
  };

  // Fonction pour gérer l'accès aux paramètres avec authentification
  const handleSecureAccess = (action: string) => {
    setPendingAction(action);
    setShowPasswordDialog(true);
  };

  // Fonction pour confirmer l'authentification et exécuter l'action
  const handlePasswordConfirmation = async () => {
    if (!password.trim()) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez saisir votre mot de passe",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyPasswordForSettings(password);

      // Mot de passe correct, exécuter l'action
      switch (pendingAction) {
        case 'pharmacy-profile':
          window.location.href = '/pharmacy-profile';
          break;
        case 'create-pharmacy':
          window.location.href = '/create-pharmacy';
          break;
        case 'applications':
          setActiveTab('applications');
          break;
        default:
          break;
      }

      // Réinitialiser les états
      setShowPasswordDialog(false);
      setPassword("");
      setPendingAction(null);

      toast({
        title: "Accès autorisé",
        description: "Authentification réussie",
      });

    } catch (error) {
      toast({
        title: "Erreur d'authentification",
        description: "Mot de passe incorrect. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleSendResponse = (orderId: string, originalMedications: any[]) => {
    // Traiter les médicaments du patient
    const patientMedications = originalMedications.map((med: any, index: number) => {
      const statusKey = `${orderId}-${index}`;
      const priceKey = `${orderId}-${index}`;
      const status = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };
      const price = medicationPrices[priceKey] || '';
      const name = medicationNames[statusKey] || med.name;

      console.log(`Patient med ${index}:`, {
        name,
        price: price ? parseFloat(price) : 0,
        status,
        priceKey,
        rawPrice: price
      });

      return {
        ...med,
        name,
        price: price ? parseFloat(price) : 0,
        available: status.available,
        surBon: status.surBon
      };
    });

    // Traiter les médicaments ajoutés par le pharmacien
    const pharmacistMedications = (orderMedications[orderId] || []).map((med: any, index: number) => {
      const statusKey = `pharmacist-${orderId}-${index}`;
      const priceKey = `pharmacist-${orderId}-${index}`;
      const status = medicationStatuses[statusKey] || { available: med.available, surBon: med.surBon };
      const price = medicationPrices[priceKey] || med.price || '';
      const name = medicationNames[statusKey] || med.name;

      console.log(`Pharmacist med ${index}:`, {
        name,
        price: price ? parseFloat(price) : (med.price ? parseFloat(med.price) : 0),
        status,
        priceKey,
        rawPrice: price,
        medPrice: med.price
      });

      return {
        ...med,
        name,
        price: price ? parseFloat(price) : (med.price ? parseFloat(med.price) : 0),
        available: status.available,
        surBon: status.surBon
      };
    });

    const allMedications = [...patientMedications, ...pharmacistMedications];

    console.log('Final medications being sent:', allMedications);
    console.log('Current medicationPrices state:', medicationPrices);
    console.log('Current orderMedications state:', orderMedications);

    sendResponseMutation.mutate({ orderId, medications: allMedications });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/icon-512x512.png" 
              alt="PharmaChape Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Dashboard Pharmacien 💊
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenue, {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSecureAccess('pharmacy-profile')}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              🔒 🏪 Gérer la pharmacie
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSecureAccess('applications')}
              className="bg-orange-50 hover:bg-orange-100 border-orange-200"
            >
              🔒 👥 Candidatures Livreurs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSecureAccess('create-pharmacy')}
              className="bg-green-50 hover:bg-green-100 border-green-200"
            >
              🔒 ➕ Créer pharmacie
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 p-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">
            Nouvelles Commandes
            {orders?.filter((o: any) => o.status === 'pending')?.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {orders.filter((o: any) => o.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparation">
            Livraison & Livreurs
            {orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'ready_for_delivery')?.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {orders.filter((o: any) => o.status === 'confirmed' || o.status === 'ready_for_delivery').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Réception des Commandes */}
        <TabsContent value="orders">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("orders")}
                data-testid="card-nouvelles-commandes"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nouvelles Commandes</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'pending')?.length || 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      🔔
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("preparation")}
                data-testid="card-en-preparation"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Préparation</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'preparing')?.length || 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      ⚗️
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("preparation")}
                data-testid="card-pretes"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prêtes</p>
                      <p className="text-2xl font-bold text-green-600">
                        {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'ready_for_delivery')?.length || 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      ✅
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                data-testid="card-livrees"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Livrées</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'delivered')?.length || 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      🚚
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des commandes...</p>
              </div>
            ) : !orders || orders?.filter((order: any) => !['ready_for_delivery', 'in_transit', 'delivered', 'cancelled'].includes(order.status))?.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📋
                  </div>
                  <h3 className="font-semibold mb-2">Aucune commande</h3>
                  <p className="text-sm text-gray-600">Les nouvelles commandes apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : orders?.filter((order: any) => !['ready_for_delivery', 'in_transit', 'delivered', 'cancelled'].includes(order.status))?.map((order: any) => (
              <Card key={order.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Commande #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant={order.status === 'pending' ? "secondary" : "outline"}>
                      {order.status === 'pending' ? 'Nouvelle' :
                       order.status === 'confirmed' ? 'Confirmée' :
                       order.status === 'preparing' ? 'En préparation' :
                       order.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    <PatientInfo order={order} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Pharmacie:</strong> {(() => {
                      if (order.pharmacy?.name) {
                        return order.pharmacy.name;
                      }
                      if (order.pharmacyId) {
                        // Essayer de récupérer le nom depuis les données de pharmacies
                        const pharmacy = pharmacies?.find(p => p.id === order.pharmacyId);
                        if (pharmacy?.name) {
                          return pharmacy.name;
                        }
                      }
                      return 'En cours d\'attribution';
                    })()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Adresse de livraison</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date de commande</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  {/* Médicaments demandés */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Médicaments demandés</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {order.medications && typeof order.medications === 'string' ? (
                        JSON.parse(order.medications).map((med: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm py-1">
                            <span>{med.name}</span>
                            {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                          </div>
                        ))
                      ) : order.medications && Array.isArray(order.medications) ? (
                        order.medications.map((med: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm py-1">
                            <span>{med.name}</span>
                            {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Aucun médicament spécifié</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid={`button-view-prescription-${order.id}`}>
                          👁️ Voir Ordonnance
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Ordonnance - Commande #{order.id.slice(0, 8)}</DialogTitle>
                          <DialogDescription>
                            Patient: {order.user?.firstName} {order.user?.lastName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Layout en deux colonnes pour ordonnance et documents */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Colonne gauche - Photo d'ordonnance */}
                            <div>
                              <h4 className="font-medium mb-3">Photo de l'ordonnance</h4>
                              {order.prescriptionId ? (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <p className="text-sm text-gray-600 mb-3">Ordonnance ID: {order.prescriptionId}</p>
                                  <div className="bg-white rounded-lg overflow-hidden border">
                                    <PrescriptionImage
                                      prescriptionId={order.prescriptionId}
                                      className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                    <div className="p-2 bg-gray-50 text-center">
                                      <p className="text-xs text-gray-500">Cliquez pour agrandir</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="border rounded-lg p-6 bg-yellow-50">
                                  <div className="text-center">
                                    <span className="text-4xl mb-2 block">⚠️</span>
                                    <p className="text-sm text-yellow-700 font-medium">Commande sans ordonnance</p>
                                    <p className="text-xs text-yellow-600 mt-1">Cette commande a été passée sans ordonnance photographiée</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Colonne droite - Documents BON et informations */}
                            <div>
                              <h4 className="font-medium mb-3">Documents BON et informations</h4>
                              <div className="space-y-3">
                                {/* Documents BON */}
                                {order.bonDocuments ? (
                                  <div className="border rounded-lg p-4 bg-blue-50">
                                    <h5 className="font-medium text-blue-900 mb-2">Documents BON uploadés</h5>
                                    <div className="space-y-2">
                                      {JSON.parse(order.bonDocuments).map((doc: any, index: number) => (
                                        <div key={index} className="bg-white rounded border">
                                          <div className="flex items-center justify-between p-2">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-blue-600">📄</span>
                                              <span className="text-sm font-medium">{doc.name}</span>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const imageKey = `${order.id}-${index}`;
                                                setVisibleImages(prev => ({
                                                  ...prev,
                                                  [imageKey]: !prev[imageKey]
                                                }));
                                              }}
                                            >
                                              {visibleImages[`${order.id}-${index}`] ? '👁️ Cacher' : '👁️ Voir'}
                                            </Button>
                                          </div>

                                          {/* Image affichée directement */}
                                          {visibleImages[`${order.id}-${index}`] && (
                                            <div className="border-t p-4 bg-gray-50">
                                              <img
                                                src={doc.data}
                                                alt={`Document BON: ${doc.name}`}
                                                className="w-full max-h-80 object-contain rounded cursor-pointer hover:shadow-lg transition-shadow"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();

                                                  // Ouvrir en plein écran pour agrandir
                                                  const modal = document.createElement('div');
                                                  modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
                                                  modal.style.zIndex = '9999';
                                                  modal.style.cursor = 'pointer';

                                                  const modalContent = document.createElement('div');
                                                  modalContent.className = 'relative max-w-full max-h-full';
                                                  modalContent.innerHTML = `
                                                    <img src="${doc.data}"
                                                         class="max-w-full max-h-full object-contain"
                                                         alt="Document BON: ${doc.name}" />
                                                    <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
                                                  `;

                                                  modal.appendChild(modalContent);

                                                  const closeModal = () => {
                                                    try {
                                                      if (modal && document.body.contains(modal)) {
                                                        document.body.removeChild(modal);
                                                      }
                                                    } catch (error) {
                                                      console.log('Modal already removed');
                                                    }
                                                  };

                                                  modalContent.addEventListener('click', (e) => e.stopPropagation());
                                                  const closeBtn = modalContent.querySelector('button');
                                                  closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
                                                  modal.addEventListener('click', closeModal);

                                                  const handleEscape = (e: KeyboardEvent) => {
                                                    if (e.key === 'Escape') {
                                                      closeModal();
                                                      document.removeEventListener('keydown', handleEscape);
                                                    }
                                                  };
                                                  document.addEventListener('keydown', handleEscape);

                                                  document.body.appendChild(modal);
                                                }}
                                              />
                                              <p className="text-xs text-gray-500 mt-2 text-center">
                                                Cliquez sur l'image pour l'agrandir
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border rounded-lg p-4 bg-gray-50">
                                    <p className="text-sm text-gray-500 text-center">Aucun document BON uploadé</p>
                                  </div>
                                )}

                                {/* Informations supplémentaires */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <h5 className="font-medium mb-2">Informations de la commande</h5>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</p>
                                    <p><span className="font-medium">Notes:</span> {order.deliveryNotes || "Aucune note"}</p>
                                    {order.totalAmount && (
                                      <p><span className="font-medium">Montant estimé:</span> {order.totalAmount} FCFA</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Gestion des médicaments */}
                          <div>
                            <h4 className="font-medium mb-3">Gestion des médicaments</h4>

                            {/* Section pour ajouter de nouveaux médicaments */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-blue-900 mb-3">➕ Ajouter des médicaments depuis l'ordonnance</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <Input
                                  placeholder="Nom du médicament"
                                  value={newMedication.name}
                                  onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                                />
                                <Input
                                  type="number"
                                  placeholder="Prix (FCFA)"
                                  value={newMedication.price}
                                  onChange={(e) => setNewMedication(prev => ({ ...prev, price: e.target.value }))}
                                  min="0"
                                  step="1"
                                />
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`new-med-surbon-${order.id}`}
                                    checked={newMedication.surBon}
                                    onCheckedChange={(checked) => setNewMedication(prev => ({ ...prev, surBon: checked }))}
                                  />
                                  <Label htmlFor={`new-med-surbon-${order.id}`} className="text-sm">
                                    Sur BON
                                  </Label>
                                </div>
                              </div>
                              <Button
                                onClick={() => addMedicationToOrder(order.id)}
                                disabled={!newMedication.name.trim() || !newMedication.price}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                ➕ Ajouter ce médicament
                              </Button>
                            </div>

                            {/* Liste des médicaments existants et ajoutés */}
                            <div className="space-y-3">
                              {/* Médicaments du patient */}
                              {order.medications && typeof order.medications === 'string' ? (
                                JSON.parse(order.medications).map((med: any, index: number) => {
                                  const statusKey = `${order.id}-${index}`;
                                  const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };

                                  return (
                                    <div key={index} className="border rounded-lg p-4 bg-white">
                                      <div className="flex items-center justify-between mb-3">
                                        {editingMedication[statusKey] ? (
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Input
                                              value={medicationNames[statusKey] || med.name}
                                              onChange={(e) => updateMedicationName(order.id, index, e.target.value, true)}
                                              className="flex-1"
                                              placeholder="Nom du médicament"
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() => toggleEditMode(statusKey)}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              ✅
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setMedicationNames(prev => {
                                                  const updated = { ...prev };
                                                  delete updated[statusKey];
                                                  return updated;
                                                });
                                                toggleEditMode(statusKey);
                                              }}
                                            >
                                              ❌
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center space-x-2 flex-1">
                                            <h5 className="font-medium">{medicationNames[statusKey] || med.name}</h5>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => toggleEditMode(statusKey)}
                                              className="text-blue-600 hover:text-blue-700"
                                            >
                                              ✏️
                                            </Button>
                                          </div>
                                        )}
                                        <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                          {currentStatus.available ? "Disponible" : "Indisponible"}
                                        </Badge>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id={`available-${statusKey}`}
                                            checked={currentStatus.available}
                                            onCheckedChange={(checked) =>
                                              toggleMedicationStatus(order.id, index, 'available', checked)
                                            }
                                          />
                                          <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                            Disponible en stock
                                          </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id={`surbon-${statusKey}`}
                                            checked={currentStatus.surBon}
                                            onCheckedChange={(checked) =>
                                              toggleMedicationStatus(order.id, index, 'surBon', checked)
                                            }
                                          />
                                          <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                            Sur BON (remboursable)
                                          </Label>
                                        </div>
                                      </div>

                                      {/* Prix du médicament */}
                                      <div className="mt-3">
                                        <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                          Prix (FCFA)
                                        </Label>
                                        <Input
                                          id={`price-${statusKey}`}
                                          type="number"
                                          placeholder="Prix en FCFA"
                                          value={medicationPrices[statusKey] || ''}
                                          onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                          className="mt-1"
                                          min="0"
                                          step="1"
                                        />
                                      </div>
                                    </div>
                                  );
                                })
                              ) : order.medications && Array.isArray(order.medications) ? (
                                order.medications.map((med: any, index: number) => {
                                  const statusKey = `${order.id}-${index}`;
                                  const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };

                                  return (
                                    <div key={index} className="border rounded-lg p-4 bg-white">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium">{med.name}</h5>
                                        <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                          {currentStatus.available ? "Disponible" : "Indisponible"}
                                        </Badge>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id={`available-${statusKey}`}
                                            checked={currentStatus.available}
                                            onCheckedChange={(checked) =>
                                              toggleMedicationStatus(order.id, index, 'available', checked)
                                            }
                                          />
                                          <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                            Disponible en stock
                                          </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id={`surbon-${statusKey}`}
                                            checked={currentStatus.surBon}
                                            onCheckedChange={(checked) =>
                                              toggleMedicationStatus(order.id, index, 'surBon', checked)
                                            }
                                          />
                                          <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                            Sur BON (remboursable)
                                          </Label>
                                        </div>
                                      </div>

                                      {/* Prix du médicament */}
                                      <div className="mt-3">
                                        <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                          Prix (FCFA)
                                        </Label>
                                        <Input
                                          id={`price-${statusKey}`}
                                          type="number"
                                          placeholder="Prix en FCFA"
                                          value={medicationPrices[statusKey] || ''}
                                          onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                          className="mt-1"
                                          min="0"
                                          step="1"
                                        />
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-gray-500">Aucun médicament spécifié par le patient</p>
                              )}

                              {/* Médicaments ajoutés par le pharmacien */}
                              {orderMedications[order.id] && orderMedications[order.id].length > 0 && (
                                <div className="border-t pt-4">
                                  <h5 className="font-medium text-blue-900 mb-3">💊 Médicaments ajoutés depuis l'ordonnance</h5>
                                  <div className="space-y-3">
                                    {orderMedications[order.id].map((med: any, index: number) => {
                                      const statusKey = `pharmacist-${order.id}-${index}`;
                                      const currentStatus = medicationStatuses[statusKey] || { available: med.available, surBon: med.surBon };

                                      return (
                                        <div key={statusKey} className="border rounded-lg p-4 bg-blue-50">
                                          <div className="flex items-center justify-between mb-3">
                                            {editingMedication[statusKey] ? (
                                              <div className="flex items-center space-x-2 flex-1">
                                                <Input
                                                  value={medicationNames[statusKey] || med.name}
                                                  onChange={(e) => updateMedicationName(order.id, index, e.target.value, false)}
                                                  className="flex-1"
                                                  placeholder="Nom du médicament"
                                                />
                                                <Button
                                                  size="sm"
                                                  onClick={() => toggleEditMode(statusKey)}
                                                  className="bg-green-600 hover:bg-green-700"
                                                >
                                                  ✅
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setMedicationNames(prev => {
                                                      const updated = { ...prev };
                                                      delete updated[statusKey];
                                                      return updated;
                                                    });
                                                    toggleEditMode(statusKey);
                                                  }}
                                                >
                                                  ❌
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => removePharmaticistMedication(order.id, index)}
                                                  className="text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200"
                                                  title="Supprimer ce médicament"
                                                >
                                                  🗑️
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="flex items-center space-x-2 flex-1">
                                                <h5 className="font-medium text-blue-900">{medicationNames[statusKey] || med.name}</h5>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => toggleEditMode(statusKey)}
                                                  className="text-blue-600 hover:text-blue-700"
                                                >
                                                  ✏️
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => removePharmaticistMedication(order.id, index)}
                                                  className="text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200"
                                                  title="Supprimer ce médicament"
                                                >
                                                  🗑️
                                                </Button>
                                              </div>
                                            )}
                                            <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                              {currentStatus.available ? "Disponible" : "Indisponible"}
                                            </Badge>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div className="flex items-center space-x-2">
                                              <Switch
                                                id={`available-${statusKey}`}
                                                checked={currentStatus.available}
                                                onCheckedChange={(checked) =>
                                                  toggleMedicationStatus(order.id, index, 'available', checked)
                                                }
                                              />
                                              <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                                Disponible en stock
                                              </Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                              <Switch
                                                id={`surbon-${statusKey}`}
                                                checked={currentStatus.surBon}
                                                onCheckedChange={(checked) =>
                                                  toggleMedicationStatus(order.id, index, 'surBon', checked)
                                                }
                                              />
                                              <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                                Sur BON (remboursable)
                                              </Label>
                                            </div>
                                          </div>

                                          <div className="mt-3">
                                            <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                              Prix (FCFA)
                                            </Label>
                                            <Input
                                              id={`price-${statusKey}`}
                                              type="number"
                                              placeholder="Prix en FCFA"
                                              value={medicationPrices[statusKey] || med.price || ''}
                                              onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                              className="mt-1"
                                              min="0"
                                              step="1"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2 mt-4 pt-4 border-t">
                              <Button
                                onClick={() => {
                                  const originalMeds = order.medications && typeof order.medications === 'string'
                                    ? JSON.parse(order.medications)
                                    : (order.medications && Array.isArray(order.medications) ? order.medications : []);

                                  handleSendResponse(order.id, originalMeds);
                                }}
                                disabled={sendResponseMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                📤 Envoyer la réponse
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Candidatures de Livreurs */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>👥 Candidatures de Livreurs</CardTitle>
                <CardDescription>
                  Gérez les candidatures des livreurs qui souhaitent rejoindre votre pharmacie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryApplicationsManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation et Préparation */}
          <TabsContent value="preparation">
            <Card>
              <CardHeader>
                <CardTitle>⚗️ Validation & Préparation</CardTitle>
                <CardDescription>
                  Commandes confirmées à préparer et commandes prêtes pour livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Section: Commandes en préparation */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">⚗️</span>
                      En Préparation
                    </h3>
                    <div className="space-y-4">
                      {orders?.filter((order: any) => order.status === 'confirmed').length === 0 ? (
                        <div className="border rounded-lg p-6 bg-gray-50 text-center">
                          <div className="text-gray-400 mb-2">⚗️</div>
                          <p className="text-sm text-gray-600">Aucune commande en préparation</p>
                        </div>
                      ) : orders?.filter((order: any) => order.status === 'confirmed').map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">Commande #{order.id.slice(0, 8)}</h4>
                              <p className="text-sm text-gray-600">
                                Patient: {order.user?.firstName} {order.user?.lastName}
                              </p>
                            </div>
                            <Badge>En préparation</Badge>
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            <div className="text-sm">
                              <span className="font-medium">Montant total:</span> {(() => {
                                if (order.totalAmount && order.totalAmount !== '0' && order.totalAmount !== '0.00') {
                                  return `${parseFloat(order.totalAmount).toFixed(0)} FCFA`;
                                }
                                // Calculer le total à partir des médicaments si disponible
                                try {
                                  const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : (order.medications || []);
                                  const total = medications.reduce((sum: number, med: any) => {
                                    const price = parseFloat(med.price) || 0;
                                    const isAvailable = med.available !== false;
                                    return sum + (price > 0 && isAvailable ? price : 0);
                                  }, 0);
                                  return total > 0 ? `${total.toFixed(0)} FCFA` : 'En cours d\'évaluation';
                                } catch (error) {
                                  console.error('Error calculating total:', error);
                                  return 'En cours d\'évaluation';
                                }
                              })()} 
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Adresse:</span> {order.deliveryAddress}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleOrderUpdate(order.id, 'ready_for_delivery')}
                              disabled={updateOrderMutation.isPending}
                            >
                              📦 Prêt pour livraison
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Commandes prêtes pour livraison avec assignation de livreur */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">📦</span>
                      Prêtes pour Livraison - Assignation des Livreurs
                    </h3>
                    <ReadyForDeliveryOrders orders={orders || []} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog d'authentification pour l'accès aux paramètres */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                🔐 Authentification requise
              </DialogTitle>
              <DialogDescription>
                Pour accéder aux paramètres de gestion de la pharmacie, veuillez confirmer votre identité en saisissant votre mot de passe.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="security-password">Mot de passe</Label>
                <Input
                  id="security-password"
                  type="password"
                  placeholder="Saisissez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isVerifying) {
                      handlePasswordConfirmation();
                    }
                  }}
                  disabled={isVerifying}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPassword("");
                    setPendingAction(null);
                  }}
                  disabled={isVerifying}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handlePasswordConfirmation}
                  disabled={isVerifying || !password.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Vérification...
                    </>
                  ) : (
                    "Confirmer"
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Sécurité :</strong> Cette vérification permet de s'assurer que seul le titulaire du compte peut accéder aux paramètres sensibles de la pharmacie.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}