
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Trash2, ShoppingCart, CreditCard, X } from "lucide-react";

interface Medication {
  name: string;
  available: boolean;
  surBon: boolean;
  price: number;
  selected?: boolean;
}

export default function OrderValidationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const searchParams = useSearch();
  
  // Get order ID from URL
  const orderId = new URLSearchParams(searchParams).get('orderId');
  
  console.log('Order validation - URL:', location, 'orderId:', orderId);
  
  const [selectedMedications, setSelectedMedications] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/orders/${orderId}`, "GET");
      return response.json();
    },
    enabled: !!orderId
  });

  // Initialize selected medications when order data loads
  useEffect(() => {
    if (order?.medications) {
      const medications = typeof order.medications === 'string' 
        ? JSON.parse(order.medications) 
        : order.medications;
      
      const initialSelection: Record<string, boolean> = {};
      medications.forEach((med: Medication, index: number) => {
        if (med.available) {
          initialSelection[`${med.name}-${index}`] = true;
        }
      });
      setSelectedMedications(initialSelection);
    }
  }, [order]);

  // Calculate total price
  const calculateTotal = () => {
    if (!order?.medications) return 0;
    
    const medications = typeof order.medications === 'string' 
      ? JSON.parse(order.medications) 
      : order.medications;
    
    return medications.reduce((total: number, med: Medication, index: number) => {
      const key = `${med.name}-${index}`;
      if (selectedMedications[key] && med.available && med.price) {
        return total + med.price;
      }
      return total;
    }, 0);
  };

  const subtotal = calculateTotal();
  const deliveryFee = 1000;
  const grandTotal = subtotal + deliveryFee;

  // Toggle medication selection
  const toggleMedication = (medicationKey: string) => {
    setSelectedMedications(prev => ({
      ...prev,
      [medicationKey]: !prev[medicationKey]
    }));
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (paymentData: any) =>
      apiRequest("/api/orders/payment", "POST", paymentData),
    onSuccess: () => {
      toast({
        title: "Paiement confirmé",
        description: "Votre commande est maintenant en cours de livraison",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate('/dashboard-patient');
    },
    onError: () => {
      toast({
        title: "Erreur de paiement",
        description: "Impossible de traiter le paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: () => apiRequest(`/api/orders/${orderId}/cancel`, "POST"),
    onSuccess: () => {
      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate('/dashboard-patient');
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!paymentMethod) {
      toast({
        title: "Méthode de paiement requise",
        description: "Veuillez sélectionner un moyen de paiement",
        variant: "destructive",
      });
      return;
    }

    if (subtotal === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un médicament",
        variant: "destructive",
      });
      return;
    }

    // Créer la liste des médicaments sélectionnés avec leurs détails
    const medications = typeof order.medications === 'string' 
      ? JSON.parse(order.medications) 
      : order.medications;
    
    const selectedMedicationsDetails = medications
      .map((med: Medication, index: number) => ({
        ...med,
        selected: selectedMedications[`${med.name}-${index}`] || false,
        index: index
      }))
      .filter((med: any) => med.selected);

    const paymentData = {
      orderId: order.id,
      paymentMethod,
      amount: grandTotal,
      deliveryFee: deliveryFee,
      selectedMedications: selectedMedicationsDetails
    };

    paymentMutation.mutate(paymentData);
  };

  const handleCancelOrder = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      cancelOrderMutation.mutate();
    }
  };

  const getPaymentMethods = () => {
    return [
      { id: 'wave', name: 'WAVE CI', number: '+225 0701234567', color: 'bg-blue-600' },
      { id: 'orange', name: 'Orange Money', number: '+225 0701234568', color: 'bg-orange-600' },
      { id: 'moov', name: 'Moov Money', number: '+225 0501234567', color: 'bg-purple-600' },
      { id: 'momo', name: 'MTN MoMo', number: '+225 0501234568', color: 'bg-yellow-600' }
    ];
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">Commande non trouvée</p>
            <Button onClick={() => navigate('/dashboard-patient')}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des détails de la commande...</p>
        </div>
      </div>
    );
  }

  const medications = order?.medications ? 
    (typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard-patient')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Validation de la commande
            </h1>
            <p className="text-gray-600">
              Commande #{order?.id?.slice(0, 8)} - {order?.pharmacy?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medications List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Médicaments disponibles
                </CardTitle>
                <CardDescription>
                  Sélectionnez les médicaments que vous souhaitez commander
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medications.map((med: Medication, index: number) => {
                    const key = `${med.name}-${index}`;
                    const isSelected = selectedMedications[key] || false;
                    
                    return (
                      <div 
                        key={index}
                        className={`border rounded-lg p-4 transition-all ${
                          med.available 
                            ? isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {med.available && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleMedication(key)}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{med.name}</h4>
                                {med.surBon && (
                                  <Badge variant="outline" className="text-xs">
                                    Sur BON
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <Badge 
                                  variant={med.available ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {med.available ? "Disponible" : "Indisponible"}
                                </Badge>
                                
                                {med.available && med.price && (
                                  <span className="text-lg font-semibold text-green-600">
                                    {med.price.toLocaleString()} FCFA
                                  </span>
                                )}
                              </div>
                              
                              {!med.available && (
                                <p className="text-sm text-red-600 mt-1">
                                  Ce médicament n'est pas disponible actuellement
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pharmacy Info */}
                <div className="pb-4 border-b">
                  <p className="text-sm text-gray-600">Pharmacie</p>
                  <p className="font-medium">{order?.pharmacy?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{order?.deliveryAddress}</p>
                </div>

                {/* Selected Medications */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Médicaments sélectionnés</p>
                  {medications.filter((_: any, index: number) => {
                    const key = `${medications[index].name}-${index}`;
                    return selectedMedications[key];
                  }).length > 0 ? (
                    medications.map((med: Medication, index: number) => {
                      const key = `${med.name}-${index}`;
                      if (!selectedMedications[key]) return null;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="truncate flex-1 pr-2">{med.name}</span>
                          <span className="font-medium">{med.price?.toLocaleString()} FCFA</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 italic">Aucun médicament sélectionné</p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total médicaments</span>
                    <span>{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de livraison</span>
                    <span>{deliveryFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total à payer</span>
                    <span className="text-blue-600">{grandTotal.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={subtotal === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Procéder au paiement
                  </Button>
                  
                  <Button
                    onClick={handleCancelOrder}
                    variant="destructive"
                    className="w-full"
                    disabled={cancelOrderMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler la commande
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">💳 Paiement</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Récapitulatif du paiement</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Médicaments:</span>
                      <span>{subtotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison:</span>
                      <span>{deliveryFee.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total:</span>
                      <span>{grandTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="font-medium mb-3">Choisir le moyen de paiement</h4>
                  <div className="space-y-2">
                    {getPaymentMethods().map((method) => (
                      <div 
                        key={method.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          paymentMethod === method.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            paymentMethod === method.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {paymentMethod === method.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-gray-600">{method.number}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Instructions */}
                {paymentMethod && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">📋 Instructions</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p>1. Ouvrez votre app {getPaymentMethods().find(m => m.id === paymentMethod)?.name}</p>
                      <p>2. Envoyez <strong>{grandTotal.toLocaleString()} FCFA</strong> au numéro:</p>
                      <p className="font-bold">{getPaymentMethods().find(m => m.id === paymentMethod)?.number}</p>
                      <p>3. Confirmez ci-dessous une fois le paiement effectué</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePayment}
                    disabled={!paymentMethod || paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? 'Traitement...' : 'Confirmer'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
