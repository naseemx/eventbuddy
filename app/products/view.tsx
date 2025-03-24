import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image as RNImage,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Tag,
  Package,
  Clock,
  Edit,
  ShoppingCart,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  AlertCircle,
} from "lucide-react-native";
import { getProductById, updateProduct } from "../../services/productService";
import { supabase } from "../../lib/supabase";

import Header from "../../components/Header";
import Notification from "../../components/Notification";

interface Image {
  base64: string;
}

export default function ProductViewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  
  // Image carousel state
  const [images, setImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Status management
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable">("Available");
  const [currentCustomer, setCurrentCustomer] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning"
  });

  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [isRentalHistoryLoading, setIsRentalHistoryLoading] = useState(true);

  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const productData = await getProductById(id);
      
      if (!productData) {
        setError("Product not found");
        return;
      }
      
      setProduct(productData);
      setCurrentStatus(productData.status as "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable");
      
      // Set customer details if product is rented or sold
      if ((productData.status === "Rented" || productData.status === "Sold") && productData.customer_name) {
        setCurrentCustomer(productData.customer_name);
        setCustomerEmail(productData.customer_email || "");
        setCustomerPhone(productData.customer_phone || "");
      }
      
      // Parse images from JSON string
      try {
        if (productData.images) {
          const parsedImages = JSON.parse(productData.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // Ensure all images have valid base64 data
            const validImages = parsedImages.filter(img => img && img.base64);
            setImages(validImages);
          } else {
            setImages([]);
          }
        } else {
          setImages([]);
        }
      } catch (err) {
        console.error("Error parsing images:", err);
        setImages([]);
      }
      
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalHistory = async () => {
    if (!id) return;
    
    try {
      setIsRentalHistoryLoading(true);
      // Fetch rental history for this product from orders table
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          start_date,
          end_date,
          return_date,
          total_amount,
          status,
          payment_status,
          created_at
        `)
        .ilike('items', `%${id}%`)
        .eq('order_type', 'rental')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching rental history:", error);
        return;
      }
      
      setRentalHistory(data || []);
    } catch (err) {
      console.error("Error in rental history fetch:", err);
    } finally {
      setIsRentalHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchRentalHistory();
  }, [id]);

  // Add useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen is focused (including after navigating back)
      fetchProduct();
      fetchRentalHistory();
      return () => {
        // Optional cleanup
      };
    }, [id])
  );

  const handleEditProduct = () => {
    if (id) {
      router.push(`/products/add?id=${id}`);
    }
  };

  const handleRentProduct = () => {
    if (!product) return;
    router.push(`/orders/add?productId=${product.id}&type=rental`);
  };
  
  const handleSellProduct = () => {
    if (!product) return;
    router.push(`/orders/add?productId=${product.id}&type=sale`);
  };

  const updateProductStatus = async (newStatus: "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable") => {
    try {
      // Only update the status field, not trying to update customer fields
      const updates = { status: newStatus };
      
      // Update the status in the database
      const updatedProduct = await updateProduct(id as string, updates);
      
      if (updatedProduct) {
        // Update local state immediately
        setCurrentStatus(newStatus);
        setProduct({
          ...product, 
          status: newStatus
        });
        setShowStatusModal(false);
        
        // Optionally show a success notification
        setNotification({
          visible: true,
          message: `Product status updated to ${newStatus}`,
          type: "success"
        });
        
        // Refresh data after status change
        setTimeout(() => {
          fetchProduct();
        }, 300);
      } else {
        setNotification({
          visible: true,
          message: "Failed to update product status",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      setNotification({
        visible: true,
        message: `Failed to update product status: ${error instanceof Error ? error.message : String(error)}`,
        type: "error"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Rented":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-purple-100 text-purple-800";
      case "Maintenance":
        return "bg-orange-100 text-orange-800";
      case "Unavailable":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Replace the rental history section with this enhanced version
  const renderRentalHistory = () => {
    if (isRentalHistoryLoading) {
      return (
        <View className="items-center justify-center py-4">
          <ActivityIndicator size="small" color="#0000ff" />
          <Text className="text-gray-500 mt-2">Loading rental history...</Text>
        </View>
      );
    }

    if (!rentalHistory || rentalHistory.length === 0) {
      return (
        <View className="items-center justify-center py-6 bg-gray-50 rounded-lg">
          <Calendar size={30} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">No rental history available</Text>
        </View>
      );
    }

    return (
      <View>
        {rentalHistory.map((rental, index) => {
          // Format dates for display
          const startDate = rental.start_date ? formatDate(rental.start_date) : 'N/A';
          const endDate = rental.end_date ? formatDate(rental.end_date) : 'N/A';
          const returnDate = rental.return_date ? formatDate(rental.return_date) : 'Not returned';
          
          // Determine status color
          let statusColor = 'bg-gray-100 text-gray-800';
          if (rental.status === 'Active') statusColor = 'bg-green-100 text-green-800';
          else if (rental.status === 'Returned') statusColor = 'bg-blue-100 text-blue-800';
          else if (rental.status === 'Overdue') statusColor = 'bg-red-100 text-red-800';
          
          // Determine payment status color
          let paymentStatusColor = 'bg-gray-100 text-gray-800';
          if (rental.payment_status === 'Paid') paymentStatusColor = 'bg-green-100 text-green-800';
          else if (rental.payment_status === 'Unpaid') paymentStatusColor = 'bg-red-100 text-red-800';
          
          return (
            <View key={rental.id} className="mb-4 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              {/* Customer Info */}
              <View className="flex-row items-center mb-2">
                <User size={16} color="#6B7280" />
                <Text className="ml-2 font-medium text-gray-900">{rental.customer_name}</Text>
                <TouchableOpacity 
                  className="ml-auto"
                  onPress={() => router.push(`/orders/view?id=${rental.id}`)}
                >
                  <View className="flex-row items-center">
                    <Text className="text-blue-600 text-sm mr-1">View Order</Text>
                    <ChevronRight size={16} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Contact Info */}
              {rental.customer_phone && (
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-700 font-medium w-1/4">Phone:</Text>
                  <Text className="text-gray-800">{rental.customer_phone}</Text>
                </View>
              )}
              
              {rental.customer_email && (
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-700 font-medium w-1/4">Email:</Text>
                  <Text className="text-gray-800">{rental.customer_email}</Text>
                </View>
              )}
              
              {/* Rental Period */}
              <View className="flex-row items-center mb-2">
                <Calendar size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-600">
                  {startDate} to {endDate}
                </Text>
              </View>
              
              {/* Return Date (if applicable) */}
              {rental.status === 'Returned' && (
                <View className="flex-row items-center mb-2">
                  <Clock size={16} color="#6B7280" />
                  <Text className="ml-2 text-gray-600">
                    Returned on: {returnDate}
                  </Text>
                </View>
              )}
              
              {/* Status & Payment */}
              <View className="flex-row justify-between mt-2">
                <View className="flex-row space-x-2">
                  <View className={`px-2 py-1 rounded-full ${statusColor}`}>
                    <Text className="text-xs font-medium">{rental.status}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${paymentStatusColor}`}>
                    <Text className="text-xs font-medium">{rental.payment_status || 'Unknown'}</Text>
                  </View>
                </View>
                <Text className="font-semibold">₹{rental.total_amount.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // When opening the status modal, set initial values based on current product state
  const handleOpenStatusModal = () => {
    if (product) {
      setCurrentStatus(product.status as "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable");
      
      if ((product.status === "Rented" || product.status === "Sold") && product.customer_name) {
        setCurrentCustomer(product.customer_name);
        setCustomerEmail(product.customer_email || "");
        setCustomerPhone(product.customer_phone || "");
      } else {
        // Reset customer fields if product is not rented or sold
        setCurrentCustomer("");
        setCustomerEmail("");
        setCustomerPhone("");
      }
    }
    
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading product details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <AlertCircle size={48} color="#EF4444" />
        <Text className="mt-4 text-red-500">{error || "Product not found"}</Text>
        <TouchableOpacity 
          className="mt-6 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse specifications if present
  const specifications = product.specifications ? 
    JSON.parse(product.specifications) : 
    [];

  // Format rental and sales information
  const isForRent = product.product_type === 'rental' || product.product_type === 'both';
  const isForSale = product.product_type === 'sale' || product.product_type === 'both';

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Product Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Product Image Carousel */}
          <View className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
            {images.length > 0 ? (
              <View className="relative">
            <RNImage
                  source={{ uri: `data:image/jpeg;base64,${images[currentImageIndex]?.base64}` }}
              className="w-full h-64"
              resizeMode="cover"
            />
                
                {images.length > 1 && (
                  <>
                    <TouchableOpacity 
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full"
                      onPress={prevImage}
                    >
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full"
                      onPress={nextImage}
                    >
                      <ChevronRight size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
                      {images.map((_, index) => (
                        <View 
                          key={index} 
                          className={`h-2 w-2 rounded-full mx-1 ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`} 
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View className="w-full h-64 bg-gray-200 items-center justify-center">
                <Package size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">No image available</Text>
              </View>
            )}
          </View>

          {/* Product Info Card */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {product.name}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Package size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">{product.category}</Text>
                </View>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${getStatusColor(product.status)}`}
              >
                <Text className="text-xs font-medium">{product.status}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              {isForRent && (
              <View className="items-center flex-1 bg-blue-50 p-3 rounded-xl mr-2">
                <Text className="text-gray-600 text-sm mb-1 font-medium">
                  Rental Price
                </Text>
                <Text className="text-xl font-bold text-blue-600">
                    ₹{product.rental_price}/day
                  </Text>
                </View>
              )}
              
              {isForSale && (
                <View className="items-center flex-1 bg-purple-50 p-3 rounded-xl mr-2">
                  <Text className="text-gray-600 text-sm mb-1 font-medium">
                    Selling Price
                  </Text>
                  <Text className="text-xl font-bold text-purple-600">
                    ₹{product.selling_price}
                </Text>
              </View>
              )}
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl w-full"
                onPress={handleEditProduct}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-5">
            {(product.status === "Available" && isForRent) && (
              <TouchableOpacity
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl flex-row items-center justify-center mr-2 shadow-md"
                onPress={handleRentProduct}
              >
                <ShoppingCart size={20} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">Rent Now</Text>
              </TouchableOpacity>
            )}
            
            {(product.status === "Available" && isForSale) && (
              <TouchableOpacity
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 py-3 rounded-xl flex-row items-center justify-center mr-2 shadow-md"
                onPress={handleSellProduct}
              >
                <ShoppingBag size={20} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">Sell Now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              className="flex-1 bg-amber-500 py-3 rounded-xl flex-row items-center justify-center shadow-md"
              onPress={() => handleOpenStatusModal()}
            >
              <Clock size={20} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Change Status</Text>
            </TouchableOpacity>
          </View>

          {/* Status Change Modal */}
          {showStatusModal && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50 items-center justify-center">
              <View className="bg-white p-5 rounded-xl w-4/5 shadow-lg">
                <Text className="text-xl font-bold mb-4 text-center">
                  Change Status
                </Text>

                <TouchableOpacity
                  className={`p-3 rounded-lg mb-2 ${currentStatus === "Available" ? "bg-green-100 border border-green-500" : "bg-gray-100"}`}
                  onPress={() => setCurrentStatus("Available")}
                >
                  <Text
                    className={`font-medium ${currentStatus === "Available" ? "text-green-800" : "text-gray-800"}`}
                  >
                    Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`p-3 rounded-lg mb-2 ${currentStatus === "Unavailable" ? "bg-gray-100 border border-gray-500" : "bg-gray-100"}`}
                  onPress={() => setCurrentStatus("Unavailable")}
                >
                  <Text
                    className={`font-medium ${currentStatus === "Unavailable" ? "text-gray-800" : "text-gray-600"}`}
                  >
                    Unavailable
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-end">
                  <TouchableOpacity
                    className="bg-gray-200 px-4 py-2 rounded-lg mr-2"
                    onPress={() => setShowStatusModal(false)}
                  >
                    <Text className="font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                    onPress={() => updateProductStatus(currentStatus)}
                  >
                    <Text className="font-medium text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Product Description */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-2 text-gray-900">
              Description
            </Text>
            <Text className="text-gray-600">
              {product.description || "No description available."}
            </Text>
          </View>

          {/* Product Specifications */}
          {specifications.length > 0 && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Specifications
            </Text>
              {specifications.map((spec: string, index: number) => (
              <View
                key={index}
                className="flex-row items-center mb-2 bg-gray-50 p-2 rounded-lg"
              >
                <View className="h-2 w-2 rounded-full bg-indigo-500 mr-3" />
                <Text className="text-gray-700">{spec}</Text>
              </View>
            ))}
          </View>
          )}

          {/* Purchase Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Purchase Information
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Purchase Date:</Text>
              <Text className="font-medium text-gray-800">
                {product.purchase_date || "Not specified"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Purchase Price:</Text>
              <Text className="font-medium text-gray-800">
                ₹{product.purchase_price || "0"}
              </Text>
            </View>
          </View>

          {/* Rental History - this would come from a separate rental records table */}
          {isForRent && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Rental History
            </Text>
            {renderRentalHistory()}
          </View>
          )}

          {/* Product Details - Add customer information display */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Status Information
            </Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-700 font-medium w-1/3">Current Status:</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(product.status)}`}>
                <Text className="text-xs font-medium">{product.status}</Text>
              </View>
            </View>
            
            {(product.status === "Rented" || product.status === "Sold") && product.customer_name && (
              <>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-700 font-medium w-1/3">Customer:</Text>
                  <Text className="text-gray-800">{product.customer_name}</Text>
                </View>
                
                {product.customer_email && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-gray-700 font-medium w-1/3">Email:</Text>
                    <Text className="text-gray-800">{product.customer_email}</Text>
                  </View>
                )}
                
                {product.customer_phone && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-gray-700 font-medium w-1/3">Phone:</Text>
                    <Text className="text-gray-800">{product.customer_phone}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Notification */}
        <Notification
          visible={notification.visible}
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(prev => ({ ...prev, visible: false }))}
          autoClose={3000}
        />
      </SafeAreaView>
    </PageTransition>
  );
}
